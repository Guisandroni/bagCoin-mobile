import logging
import json
import re
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy import text
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from app.services.llm_service import get_llm
from app.database import engine
from app.agents.tenant_context import tenant_phone_error

logger = logging.getLogger(__name__)

DB_SCHEMA = """
Tabelas:
- users(id, phone_number, name, status, preferences, financial_profile, created_at, updated_at)
- transactions(id, user_id, type, amount, currency, category_id, description, source_format, transaction_date, created_at, confidence_score, raw_input)
- categories(id, user_id, name, parent_category_id, is_default, created_at)

Tipos de transação (USE SEMPRE MAIÚSCULO no SQL): EXPENSE, INCOME, TRANSFER, ADJUSTMENT
"""

ALLOWED_SQL_PATTERNS = [
    r'^\s*SELECT\s+',
    r'^\s*WITH\s+',
]

FORBIDDEN_KEYWORDS = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'UNION']


def validate_sql(query: str) -> bool:
    """Valida se a query SQL é segura."""
    query_upper = query.upper().strip()
    
    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in query_upper:
            return False
    
    # Bloqueia comentários SQL
    if '--' in query or '/*' in query:
        return False
    
    has_allowed = any(re.match(pattern, query, re.IGNORECASE) for pattern in ALLOWED_SQL_PATTERNS)
    return has_allowed


def validate_user_filter(sql: str, phone_number: str) -> bool:
    """Valida se a query filtra dados pelo user_id do usuário correto.

    Usa regex flexível para aceitar variações de alias, espaços e formatação.
    Garante isolamento: nenhuma query pode executar sem filtrar
    pelo phone_number do usuário atual.
    """
    sql_normalized = re.sub(r'\s+', ' ', sql.upper().strip())
    # Regex flexível: aceita alias opcional (ex: t., tx.) e espaços variáveis
    pattern = (
        r"(?:[a-z_]+\.)?\s*USER_ID\s*"
        r"(?:=|IN)\s*"
        r"\(?\s*SELECT\s+(?:ID\s+FROM\s+USERS\s+"
        r"|DISTINCT\s+ID\s+FROM\s+USERS\s+)"
        r"WHERE\s+(?:PHONE_NUMBER|PHONE)\s*(?:=|LIKE|ILIKE|IN)"
    )
    return bool(re.search(pattern, sql_normalized, re.IGNORECASE))


def sanitize_sql_enums(sql: str) -> str:
    """Corrige enums lowercase para UPPERCASE no SQL antes de executar."""
    # Substitui 'expense', 'income', 'transfer', 'adjustment' entre aspas simples
    replacements = {
        r"'expense'": "'EXPENSE'",
        r"'income'": "'INCOME'",
        r"'transfer'": "'TRANSFER'",
        r"'adjustment'": "'ADJUSTMENT'",
    }
    for pattern, replacement in replacements.items():
        sql = re.sub(pattern, replacement, sql, flags=re.IGNORECASE)
    return sql


def execute_sql_query(query: str, params: dict = None) -> List[Dict[str, Any]]:
    """Executa query SQL de forma segura."""
    if not validate_sql(query):
        raise ValueError("Query SQL não permitida. Apenas SELECT e WITH são autorizados.")
    
    # Sanitiza enums antes de executar
    query = sanitize_sql_enums(query)
    
    with engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        rows = [dict(row._mapping) for row in result]
        return rows


def get_date_filter(msg_lower: str) -> str:
    """Retorna cláusula WHERE de data baseada na mensagem do usuário."""
    today = datetime.utcnow().date()

    if any(p in msg_lower for p in ["hoje"]):
        return f"DATE(transaction_date) = '{today}'"

    if any(p in msg_lower for p in ["ontem"]):
        yesterday = today - timedelta(days=1)
        return f"DATE(transaction_date) = '{yesterday}'"

    if any(p in msg_lower for p in ["esta semana", "essa semana", "ultimos 7 dias", "semana"]):
        week_ago = today - timedelta(days=7)
        return f"transaction_date >= '{week_ago}'"

    if any(p in msg_lower for p in ["ultimos 30 dias", "ultimo mes", "mes passado"]):
        return "transaction_date >= CURRENT_DATE - INTERVAL '30 days'"

    if any(p in msg_lower for p in ["esse mes", "este mes", "mes atual", "mes corrente"]):
        return "transaction_date >= date_trunc('month', CURRENT_DATE)"

    if any(p in msg_lower for p in ["esse ano", "este ano", "ano atual"]):
        return "transaction_date >= date_trunc('year', CURRENT_DATE)"

    # Se mencionar apenas "gastei" sem período específico → assume este mês
    if any(p in msg_lower for p in ["ja gastei", "ate agora", "total", "quanto gastei"]) and not any(p in msg_lower for p in ["hoje", "ontem", "semana", "mes", "ano"]):
        return "transaction_date >= date_trunc('month', CURRENT_DATE)"

    return None


def get_fallback_query(message: str, phone_number: str) -> tuple:
    """Tenta mapear consultas comuns para SQL sem usar LLM."""
    import unicodedata
    msg_lower = message.lower()
    msg_norm = unicodedata.normalize('NFKD', msg_lower).encode('ASCII', 'ignore').decode('ASCII')
    user_filter = "user_id = (SELECT id FROM users WHERE phone_number = :phone_number)"
    date_clause = get_date_filter(msg_lower)
    date_sql = f" AND {date_clause}" if date_clause else ""

    def _in(keywords):
        """Verifica se alguma keyword está na mensagem (normalizada ou não)."""
        return any(kw in msg_lower for kw in keywords) or any(kw in msg_norm for kw in keywords)

    # Total de gastos (muitas variações)
    expense_phrases = [
        "quanto gastei", "quanto ja gastei", "quanto gastei ate agora",
        "total de gastos", "soma das despesas", "total pago",
        "gastos totais", "despesas totais", "quanto ja paguei",
    ]
    if _in(expense_phrases):
        sql = f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE {user_filter} AND type = 'EXPENSE'{date_sql}"
        period_label = _period_label(date_clause)
        return sql, f"Total de gastos{period_label}"

    # Total de receitas
    income_phrases = [
        "quanto recebi", "total de receitas", "soma das receitas",
        "total de entradas", "receitas totais", "quanto caiu",
        "quanto ganhei", "quanto entrou",
    ]
    if _in(income_phrases):
        sql = f"SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE {user_filter} AND type = 'INCOME'{date_sql}"
        period_label = _period_label(date_clause)
        return sql, f"Total de receitas{period_label}"

    # Saldo
    if _in(["saldo", "quanto sobrou", "diferenca", "balanco"]):
        if date_clause:
            sql = f"SELECT (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE {user_filter} AND type = 'INCOME' AND {date_clause}) - (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE {user_filter} AND type = 'EXPENSE' AND {date_clause}) as saldo"
        else:
            sql = f"SELECT (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE {user_filter} AND type = 'INCOME') - (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE {user_filter} AND type = 'EXPENSE') as saldo"
        return sql, "Saldo (receitas - despesas)"

    # Gastos por categoria
    category_phrases = [
        "gastos por categoria", "despesas por categoria", "categorias",
        "gastos em cada categoria", "quanto gastei em cada",
    ]
    if _in(category_phrases):
        sql = f"SELECT c.name as categoria, COALESCE(SUM(t.amount), 0) as total FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.{user_filter} AND t.type = 'EXPENSE'{date_sql} GROUP BY c.name ORDER BY total DESC"
        return sql, "Gastos por categoria"

    # Últimas transações
    if _in(["ultimas transacoes", "ultimos gastos", "historico recente", "lista de transacoes"]):
        sql = f"SELECT t.transaction_date as data, t.type as tipo, t.amount as valor, t.description as descricao, c.name as categoria FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.{user_filter}{date_sql} ORDER BY t.transaction_date DESC LIMIT 10"
        return sql, "Últimas 10 transações"

    # Maior gasto
    if _in(["maior gasto", "maior despesa", "gasto mais alto"]):
        sql = f"SELECT t.amount as valor, t.description as descricao, c.name as categoria FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.{user_filter} AND t.type = 'EXPENSE'{date_sql} ORDER BY t.amount DESC LIMIT 1"
        return sql, "Maior gasto registrado"

    # Lista de receitas
    if _in(["lista de receitas", "minhas receitas", "receitas recentes", "entradas"]):
        sql = f"SELECT t.transaction_date as data, t.amount as valor, t.description as descricao FROM transactions t WHERE t.{user_filter} AND t.type = 'INCOME'{date_sql} ORDER BY t.transaction_date DESC LIMIT 10"
        return sql, "Receitas recentes"

    # Lista de gastos
    if _in(["lista de gastos", "minhas despesas", "gastos recentes", "despesas"]):
        sql = f"SELECT t.transaction_date as data, t.amount as valor, t.description as descricao FROM transactions t WHERE t.{user_filter} AND t.type = 'EXPENSE'{date_sql} ORDER BY t.transaction_date DESC LIMIT 10"
        return sql, "Gastos recentes"

    return None, None


def _period_label(date_clause: str) -> str:
    """Gera label amigável do período para o summary."""
    if not date_clause:
        return ""
    if "CURRENT_DATE" in date_clause and "date_trunc" not in date_clause:
        if "- INTERVAL '1 day'" in date_clause:
            return " de ontem"
        if "- INTERVAL '7 days'" in date_clause or "- INTERVAL '30 days'" in date_clause:
            return " no período"
        return " de hoje"
    if "date_trunc('month'" in date_clause:
        return " deste mês"
    if "date_trunc('year'" in date_clause:
        return " deste ano"
    return ""


def process_query(state: Dict[str, Any]) -> Dict[str, Any]:
    """Processa consulta em linguagem natural e converte para SQL."""
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    terr = tenant_phone_error(phone_number)
    if terr:
        state["error"] = terr
        return state

    llm = get_llm(temperature=0.1)
    
    fallback_sql, fallback_desc = get_fallback_query(message, phone_number)
    
    if not llm and not fallback_sql:
        state["error"] = "Não reconheci o padrão da consulta. Tente algo como:\n• 'Quanto gastei hoje?'\n• 'Gastos por categoria'\n• 'Qual meu saldo?'"
        return state
    
    try:
        if fallback_sql:
            sql = fallback_sql
            description = fallback_desc
        else:
            from app.agents.persistence import get_conversation_history
            history = get_conversation_history(phone_number, limit=4)
            history_context = f"\n\nÚltimas mensagens da conversa:\n{history}" if history else ""
            
            system_prompt = f"""Você é um assistente especialista em SQL para um chatbot financeiro.
Sua tarefa é converter perguntas em português para queries SQL seguras e otimizadas.

{DB_SCHEMA}

REGRAS CRÍTICAS:
1. GERE APENAS SELECT ou WITH (CTEs). NUNCA gere INSERT, UPDATE, DELETE, DROP, ALTER.
2. SEMPRE filtre por user_id usando subquery: user_id = (SELECT id FROM users WHERE phone_number = :phone_number)
3. Use COALESCE para evitar NULLs em agregações.
4. Formato de datas: YYYY-MM-DD.
5. Use SEMPRE valores MAIÚSCULOS para o enum type: 'EXPENSE', 'INCOME', 'TRANSFER', 'ADJUSTMENT'
6. Responda APENAS com JSON: {{"sql": "...", "description": "...", "parameters": {{"phone_number": "..."}}}}
{history_context}

Exemplos:
Pergunta: "Quanto gastei esse mês?"
SQL: SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = (SELECT id FROM users WHERE phone_number = :phone_number) AND type = 'EXPENSE' AND transaction_date >= date_trunc('month', CURRENT_DATE)

Pergunta: "Gastos por categoria nos últimos 30 dias"
SQL: SELECT c.name as category, SUM(t.amount) as total FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = (SELECT id FROM users WHERE phone_number = :phone_number) AND t.type = 'EXPENSE' AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY c.name ORDER BY total DESC
"""
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Telefone: {phone_number}\nPergunta: {message}")
            ]
            
            response = llm.invoke(messages)
            result = JsonOutputParser().parse(response.content)
            
            sql = result.get("sql", "")
            description = result.get("description", "")
        
        # Sanitiza enums mesmo no fallback (garantia extra)
        sql = sanitize_sql_enums(sql)

        # Validação de segurança (apenas SELECT)
        if not validate_sql(sql):
            state["error"] = "A consulta gerada não é segura. Tente reformular."
            state["query_result"] = {"sql": sql, "error": "Query blocked by safety filter"}
            return state

        # Validação runtime: garante isolamento por usuário
        if not validate_user_filter(sql, phone_number):
            logger.warning(f"Query rejeitada por falta de filtro user_id: {sql[:200]}")
            state["error"] = "Não consegui buscar seus dados com segurança. Tente reformular a pergunta."
            state["query_result"] = {"sql": sql, "error": "Missing user_id filter"}
            return state

        # Executa query
        params = {"phone_number": phone_number}
        rows = execute_sql_query(sql, params)
        
        # Gera resumo
        summary = generate_summary(message, rows, description)
        
        state["query_result"] = {
            "sql": sql,
            "results": rows,
            "summary": summary,
            "error": None
        }
        
        logger.info(f"Query executada com sucesso: {sql[:100]}...")
        
    except Exception as e:
        logger.error(f"Erro no text-to-SQL: {e}")
        state["error"] = "Não consegui buscar seus dados. Tente reformular a pergunta de outra forma."
        state["query_result"] = {"error": str(e)}
    
    return state


def generate_summary(question: str, rows: List[Dict[str, Any]], description: str) -> str:
    """Gera resumo em linguagem natural dos resultados da query."""
    from app.agents.responses import transaction_list, category_list

    if not rows:
        return "Não encontrei registros para o período."

    # Se for uma única linha com uma métrica
    if len(rows) == 1 and len(rows[0]) == 1:
        key = list(rows[0].keys())[0]
        value = rows[0][key]
        if isinstance(value, (int, float)):
            return f"R$ {value:,.2f}"
        return f"Resultado: {value}"

    # Detecta se é lista de transações (tem data + valor + descrição)
    first_keys = {k.lower() for k in rows[0].keys()}
    is_transaction_list = bool(
        first_keys & {"data", "date", "transaction_date"} and
        first_keys & {"valor", "amount", "total"} and
        first_keys & {"descricao", "description", "desc"}
    )
    if is_transaction_list:
        # Decide título baseado na pergunta
        title = "Transações"
        q = question.lower()
        if "receita" in q or "entrada" in q:
            title = "Receitas"
        elif "gasto" in q or "despesa" in q:
            title = "Gastos"
        return transaction_list(rows, title)

    # Detecta se é gastos por categoria
    is_category_list = bool(
        first_keys & {"categoria", "category", "name"} and
        first_keys & {"total", "amount", "sum"}
    )
    if is_category_list:
        return category_list(rows)

    # Fallback: formatação genérica limpa
    lines = []
    for row in rows[:5]:
        parts = []
        for k, v in row.items():
            k_lower = k.lower()
            if isinstance(v, float):
                parts.append(f"R$ {v:,.2f}")
            elif k_lower in {"data", "date", "transaction_date"}:
                from app.agents.responses import _fmt_date
                parts.append(str(_fmt_date(v)))
            elif k_lower in {"tipo", "type"}:
                parts.append("Receita" if str(v).upper() == "INCOME" else "Gasto")
            else:
                parts.append(str(v))
        lines.append("- " + " | ".join(parts))

    return "\n".join(lines)
