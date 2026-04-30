import logging
import json
import re
import unicodedata
from typing import Dict, Any, Optional
from datetime import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from app.services.llm_service import get_llm
from app.schemas.schemas import IntentType

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Remove acentos e converte para minúsculas."""
    return unicodedata.normalize('NFKD', text.lower()).encode('ASCII', 'ignore').decode('ASCII')


# Fast-path keywords (sem acento, cobrem variações comuns)
QUERY_KEYWORDS = [
    # Quanto / quantia
    "quanto gastei", "quanto ja gastei", "quanto gastei hoje", "quanto gastei ontem",
    "quanto gastei esse mes", "quanto gastei este mes", "quanto gastei no mes",
    "quanto ja gastei hoje", "quanto ja gastei ontem", "quanto ja gastei esse mes",
    "quanto recebi", "quanto recebi hoje", "quanto recebi ontem", "quanto recebi esse mes",
    "quanto foi", "quanto custou", "quanto paguei",
    # Saldo / total
    "meu saldo", "qual meu saldo", "saldo", "total de gastos", "total de despesas",
    "total de receitas", "total gasto", "total pago", "balanco", "balanco mensal",
    # Resumo / histórico
    "resumo", "resumo mensal", "resumo financeiro", "resumo do mes", "extrato",
    "historico", "historico de gastos", "historico de despesas", "historico de receitas",
    "ultimas transacoes", "ultimas compras", "minhas compras", "minhas despesas",
    "minhas receitas", "meus gastos", "meus pagamentos",
    # Consultar / mostrar / ver / listar
    "mostrar", "ver meus", "consultar", "consulte", "lista", "listar",
    "lista de receitas", "lista de gastos", "lista de despesas", "lista de compras",
    "categorias", "gastos por categoria", "despesas por categoria", "receitas por categoria",
    "gastos do mes", "gastos da semana", "gastos de hoje", "gastos de ontem",
    "gastos deste mes", "gastos desse mes", "gastos no mes",
    "receitas do mes", "receitas da semana", "receitas de hoje",
    "despesas do mes", "despesas da semana", "despesas de hoje",
    "maior gasto", "maior despesa", "menor gasto", "menor despesa",
]

HELP_KEYWORDS = [
    "aprender", "ensinar", "como faco", "como posso", "como registrar",
    "tutorial", "me explica", "me ensina", "funciona", "ajuda", "ajudar",
    "o que voce faz", "o que você faz", "quem e voce", "quem e você",
    "como usar", "primeira vez", "novo aqui", "guia", "dica",
    "como funciona", "o que voce pode fazer", "comecar", "como comeco",
]

REPORT_KEYWORDS = [
    "relatorio", "relatorios", "pdf", "report", "gerar relatorio", "gerar pdf",
    "criar relatorio", "criar pdf", "fazer relatorio", "fazer pdf",
    "relatorio do mes", "relatorio da semana", "relatorio de hoje",
    "relatorio de gastos", "relatorio de despesas", "relatorio de receitas",
    "relatorio financeiro", "resumo em pdf", "pdf do mes", "pdf da semana",
    "gere um relatorio", "gere um pdf", "me manda o relatorio", "me manda o pdf",
    "manda o relatorio", "manda o pdf", "exportar relatorio", "exportar pdf",
]


def classify_intent(state: Dict[str, Any]) -> Dict[str, Any]:
    """Classifica a intenção da mensagem do usuário."""
    import time
    start_time = time.time()

    message = state.get("message", "")
    phone_number = state.get("phone_number", "")
    msg_lower = message.lower().strip()
    msg_norm = _normalize(message)

    # =====================================================================
    # WIZARD CHECK: Se há wizard em andamento, mantém a intenção do wizard
    # Apenas cancela se o usuário PEDIR explicitamente (cancelar, sair)
    # =====================================================================
    from app.agents.wizard import _load_wizard_state, _is_wizard_intent, _clear_wizard_state
    wizard_state = _load_wizard_state(phone_number)
    if wizard_state:
        wizard_type = wizard_state.get("type", "")
        wizard_status = wizard_state.get("status", "")
        
        # Cancela apenas se o usuário pedir explicitamente
        cancel_words = ["cancelar", "cancela", "sair", "voltar", "esquece", "desistir"]
        if any(w in msg_norm for w in cancel_words):
            _clear_wizard_state(phone_number)
            logger.info(f"[classify_intent] Wizard cancelado a pedido do usuário")
            # Deixa o fluxo continuar para classificar a nova intenção
        elif _is_wizard_intent(wizard_type) and wizard_status in ["collecting", "confirming"]:
            intent_map = {
                "create_budget": IntentType.CREATE_BUDGET,
                "create_goal": IntentType.CREATE_GOAL,
                "update_goal": IntentType.CONTRIBUTE_GOAL,
                "contribute_goal": IntentType.CONTRIBUTE_GOAL,
            }
            state["intent"] = intent_map.get(wizard_type, IntentType.UNKNOWN)
            state["confidence"] = 0.9
            state["wizard"] = wizard_state
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"[classify_intent] Wizard continuação: {elapsed:.0f}ms")
            return state

    # =====================================================================
    # FAST-PATH: Regras por keywords (sem custo de LLM)
    # =====================================================================
    # Ordem de prioridade: comandos estruturados > CRUD > registros > saudações

    # Helper: detecta valor monetário em qualquer formato
    has_value = bool(re.search(r'(?:R?\$\s*)?\d+(?:[.,]\d{1,2})?(?:\s*(?:reais|rs))?', msg_lower))
    creation_verbs = ["criar", "definir", "quero", "fazer", "estabelecer", "novo", "nova", "crie", "defina"]

    # 1. Ajuda / Tutorial
    if any(kw in msg_lower for kw in HELP_KEYWORDS) or any(kw in msg_norm for kw in HELP_KEYWORDS):
        state["intent"] = IntentType.HELP
        state["confidence"] = 0.95
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path HELP: {elapsed:.0f}ms")
        return state

    # 2. CRIAÇÃO DE ORÇAMENTO — prioridade alta (antes de saudação/consulta)
    # Captura: "orçamento de 300 para alimentação", "criar orçamento alimentação 300", "meu orçamento é 500"
    budget_creation_signals = ["orcamento", "orcamentos", "budget", "limite"]
    has_budget_word = any(w in msg_norm for w in budget_creation_signals)
    if has_budget_word:
        delete_budget_words = ["excluir", "apagar", "remover", "deletar", "exclua", "apague", "remova"]
        update_budget_words = ["mudar", "alterar", "atualizar", "mude", "altere", "atualize"]
        if any(w in msg_norm for w in delete_budget_words):
            state["intent"] = IntentType.DELETE_BUDGET
            state["confidence"] = 0.85
            return state
        if any(w in msg_norm for w in update_budget_words):
            state["intent"] = IntentType.UPDATE_BUDGET
            state["confidence"] = 0.85
            return state
        # Criação: se tem valor OU verbo de criação
        if has_value or any(w in msg_norm for w in creation_verbs):
            state["intent"] = IntentType.CREATE_BUDGET
            state["confidence"] = 0.9
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"[classify_intent] Fast-path CREATE_BUDGET: {elapsed:.0f}ms")
            return state
        # Consulta de orçamento sem valor ("meus orçamentos")
        query_budget_words = ["meus", "meu", "mostrar", "ver", "listar", "quais"]
        if any(w in msg_norm for w in query_budget_words):
            state["intent"] = IntentType.QUERY_DATA
            state["confidence"] = 0.8
            return state

    # 3. CRIAÇÃO DE META — prioridade alta
    # Captura: "meta de 300 para bicicleta", "meta 300 bicicleta", "quero guardar 1000 para viagem"
    goal_creation_signals = ["meta", "metas", "objetivo", "objetivos", "guardar", "economizar", "juntar", "poupar"]
    has_goal_word = any(w in msg_norm for w in goal_creation_signals)
    if has_goal_word:
        delete_goal_words = ["excluir", "apagar", "remover", "deletar", "exclua", "apague", "remova"]
        update_goal_words = ["mudar", "alterar", "atualizar"]
        if any(w in msg_norm for w in delete_goal_words):
            state["intent"] = IntentType.DELETE_GOAL
            state["confidence"] = 0.85
            return state
        if any(w in msg_norm for w in update_goal_words):
            state["intent"] = IntentType.UPDATE_GOAL
            state["confidence"] = 0.85
            return state
        # Contribuição
        contribute_keywords = ["guardei", "depositei", "adicionei", "coloquei", "juntei", "poupei", "depositar", "adicionar"]
        if any(w in msg_norm for w in contribute_keywords):
            state["intent"] = IntentType.CONTRIBUTE_GOAL
            state["confidence"] = 0.9
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"[classify_intent] Fast-path CONTRIBUTE_GOAL: {elapsed:.0f}ms")
            return state
        # Criação: se tem valor OU verbo de criação
        if has_value or any(w in msg_norm for w in creation_verbs):
            state["intent"] = IntentType.CREATE_GOAL
            state["confidence"] = 0.9
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"[classify_intent] Fast-path CREATE_GOAL: {elapsed:.0f}ms")
            return state
        # Consulta de meta sem valor ("minhas metas")
        query_goal_words = ["minhas", "minha", "mostrar", "ver", "listar", "quais"]
        if any(w in msg_norm for w in query_goal_words):
            state["intent"] = IntentType.QUERY_DATA
            state["confidence"] = 0.8
            return state

    # 4. Relatório / PDF
    if any(w in msg_lower for w in REPORT_KEYWORDS) or any(w in msg_norm for w in REPORT_KEYWORDS):
        state["intent"] = IntentType.GENERATE_REPORT
        state["confidence"] = 0.9
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path REPORT: {elapsed:.0f}ms")
        return state

    # 5. Gerenciamento de categorias (antes de QUERY_DATA para evitar conflito)
    cat_create = ["criar categoria", "nova categoria", "adicionar categoria", "crie uma categoria"]
    cat_delete = ["excluir categoria", "apagar categoria", "remover categoria"]
    cat_update = ["renomear categoria", "mudar nome da categoria", "alterar categoria"]
    cat_list = ["minhas categorias", "lista de categorias", "categorias disponiveis", "quais categorias tenho"]
    if any(w in msg_norm for w in cat_create):
        state["intent"] = IntentType.CREATE_CATEGORY
        state["confidence"] = 0.9
        return state
    if any(w in msg_norm for w in cat_delete):
        state["intent"] = IntentType.DELETE_CATEGORY
        state["confidence"] = 0.85
        return state
    if any(w in msg_norm for w in cat_update):
        state["intent"] = IntentType.UPDATE_CATEGORY
        state["confidence"] = 0.85
        return state
    if any(w in msg_norm for w in cat_list):
        state["intent"] = IntentType.LIST_CATEGORIES
        state["confidence"] = 0.9
        return state

    # 6. Importação de extrato bancário (antes de QUERY para evitar conflito com "extrato")
    if any(w in msg_lower for w in ["extrato", "importar", "ofx", "csv bancario", "meu banco"]):
        state["intent"] = IntentType.IMPORT_STATEMENT
        state["confidence"] = 0.9
        return state

    # 7. Excluir/atualizar transação (antes de REGISTER_EXPENSE para evitar conflito com "gasto")
    delete_tx_words = ["excluir transacao", "excluir gasto", "apagar transacao", "apagar gasto",
                       "deletar transacao", "remover gasto"]
    update_tx_words = ["corrigir transacao", "mudar valor", "alterar gasto", "corrigir valor",
                       "mudar gasto", "atualizar transacao"]
    if any(w in msg_norm for w in delete_tx_words):
        state["intent"] = IntentType.DELETE_TRANSACTION
        state["confidence"] = 0.85
        return state
    if any(w in msg_norm for w in update_tx_words):
        state["intent"] = IntentType.UPDATE_TRANSACTION
        state["confidence"] = 0.85
        return state

    # 8. Consultas (inclui saldo, gastos)
    if any(kw in msg_lower for kw in QUERY_KEYWORDS) or any(kw in msg_norm for kw in QUERY_KEYWORDS):
        state["intent"] = IntentType.QUERY_DATA
        state["confidence"] = 0.9
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path QUERY: {elapsed:.0f}ms")
        return state

    # 9. Saudação
    greeting_words = ["oi", "ola", "hello", "hey", "eai", "salve", "bom dia", "boa tarde", "boa noite", "eae", "iai"]
    if any(w in msg_lower for w in greeting_words):
        state["intent"] = IntentType.GREETING
        state["confidence"] = 0.95
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path GREETING: {elapsed:.0f}ms")
        return state

    # 9b. Agradecimento / conversa casual → CHAT
    chat_words = ["obrigado", "obrigada", "valeu", "brigado", "thanks", "thank", "show", "beleza", "top", "demais", "ótimo", "otimo", "entendi", "tendi", "blz", "ok", "certo", "perfeito", "legal", "bacana"]
    if any(w in msg_lower for w in chat_words):
        state["intent"] = IntentType.CHAT
        state["confidence"] = 0.85
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path CHAT (agradecimento): {elapsed:.0f}ms")
        return state

    # 10. Apresentação de nome
    intro_patterns = ["meu nome e", "me chamo", "eu sou o", "eu sou a", "pode me chamar de"]
    if any(p in msg_norm for p in intro_patterns):
        state["intent"] = IntentType.INTRODUCE
        state["confidence"] = 0.9
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Fast-path INTRODUCE: {elapsed:.0f}ms")
        return state

    # 11. Registro de RECEITA
    income_verbs = ["recebi", "ganhei", "salario", "renda", "entrada", "pagamento recebido",
                    "me mandaram", "me mandou", "me enviaram", "depositaram", "caiu", "transferencia recebida"]
    if any(w in msg_lower for w in income_verbs):
        state["intent"] = IntentType.REGISTER_INCOME
        state["confidence"] = 0.85
        return state

    # 12. Registro de DESPESA com verbo explícito
    expense_verbs = ["gastei", "paguei", "comprei", "despesa", "gasto"]
    if any(w in msg_lower for w in expense_verbs):
        state["intent"] = IntentType.REGISTER_EXPENSE
        state["confidence"] = 0.85
        return state

    # 13. Deep Research (antes de recomendação para não conflitar com "dica")
    if any(w in msg_lower for w in ["pesquisar", "noticia", "atual", "cenario financeiro", "tendencias", "mercado financeiro", "bolsa de valores", "ibovespa"]):
        state["intent"] = IntentType.DEEP_RESEARCH
        state["confidence"] = 0.85
        return state

    # 14. Recomendações
    if any(w in msg_lower for w in ["recomendacao", "dica", "sugestao", "investir", "economia", "onde investir"]):
        state["intent"] = IntentType.RECOMMENDATION
        state["confidence"] = 0.85
        return state

    # 15. Ativar/desativar alertas
    if any(w in msg_norm for w in ["alerta", "alertas", "notificacao", "notificacoes"]):
        if any(w in msg_norm for w in ["desativar", "desligar", "silenciar", "pausar"]):
            state["intent"] = IntentType.TOGGLE_ALERTS
            state["confidence"] = 0.85
            return state
        if any(w in msg_norm for w in ["ativar", "ligar", "habilitar"]):
            state["intent"] = IntentType.TOGGLE_ALERTS
            state["confidence"] = 0.85
            return state

    # 14. Padrão: descrição + número (ex: "Mercado 240", "Uber 30", "14 em pão")
    desc_value_pattern = re.search(r'^[a-z\s]+\s+\d+(?:[.,]\d{1,2})?$', msg_lower)
    value_desc_pattern = re.search(r'^\d+(?:[.,]\d{1,2})?\s+(?:em|de|no|na)\s+[a-z\s]+$', msg_lower)
    if desc_value_pattern or value_desc_pattern:
        if not any(q in msg_lower for q in ["quanto", "qual", "quantos"]):
            state["intent"] = IntentType.REGISTER_EXPENSE
            state["confidence"] = 0.75
            return state

    # 15. Se contém número e palavras de despesa implícitas (ex: "pix 340" sem contexto de receita)
    if re.search(r'\d+', msg_lower) and any(w in msg_lower for w in ["pix", "boleto", "conta", "compra"]):
        # Verifica se não é receita (sem verbos de entrada)
        if not any(w in msg_lower for w in income_verbs):
            state["intent"] = IntentType.REGISTER_EXPENSE
            state["confidence"] = 0.7
            return state

    # 16. Correção
    if any(w in msg_lower for w in ["corrigir", "errado", "nao e", "troca", "mude", "alterar"]):
        state["intent"] = IntentType.CORRECTION
        state["confidence"] = 0.8
        return state

    # =====================================================================
    # FALLBACK LLM com few-shot examples
    # Só inicializa LLM quando fast-path falha
    # =====================================================================
    llm_start = time.time()
    llm = get_llm(temperature=0.1)
    llm_init_ms = (time.time() - llm_start) * 1000
    logger.info(f"[classify_intent] get_llm() init: {llm_init_ms:.0f}ms")

    if not llm:
        state["intent"] = IntentType.UNKNOWN
        state["confidence"] = 0.0
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] Sem LLM → UNKNOWN: {elapsed:.0f}ms")
        return state

    system_prompt = """Você é um classificador de intenções para um chatbot financeiro.
Analise a mensagem do usuário e classifique em uma das categorias abaixo.
Responda APENAS com um JSON no formato: {"intent": "CATEGORIA", "confidence": 0.95}

Categorias disponíveis:
- register_expense: registrar gasto/despesa. Exemplos: "gastei 50 no mercado", "uber 12 reais", "paguei 200 de luz", "Mercado 240", "14 em pão", "pix 340"
- register_income: registrar receita/entrada. Exemplos: "recebi 5000 de salário", "meu pai me mandou 170", "ganhei 100 de freelance"
- query_data: consultar dados financeiros. Exemplos: "quanto gastei esse mês?", "qual meu saldo?", "gastos por categoria", "meu maior gasto", "quanto já gastei"
- generate_report: gerar relatório/PDF. Exemplos: "gerar relatório", "pdf do mês", "resumo mensal em pdf"
- create_budget: criar orçamento. Exemplos: "definir orçamento de 5000", "limite de gastos"
- create_goal: criar meta financeira. Exemplos: "quero guardar 10000", "meta de viagem"
- contribute_goal: contribuir para meta existente. Exemplos: "guardei 500 na meta viagem", "depositei 200 na meta bike", "adicionei 100 para reserva"
- delete_budget: excluir/apagar orçamento. Exemplos: "excluir orçamento", "apagar budget", "remover limite"
- update_budget: atualizar/alterar orçamento. Exemplos: "mudar orçamento de alimentação", "atualizar limite para 4000"
- delete_goal: excluir meta. Exemplos: "excluir meta", "apagar meta viagem"
- update_goal: atualizar meta. Exemplos: "mudar meta de viagem", "alterar valor da meta"
- delete_transaction: excluir transação. Exemplos: "excluir gasto", "apagar transação"
- update_transaction: corrigir transação. Exemplos: "corrigir valor", "mudar gasto de ontem"
- toggle_alerts: ativar/desativar alertas. Exemplos: "desativar alertas", "ligar notificações"
- recommendation: pedir recomendação/dica. Exemplos: "onde investir?", "dica de economia"
- deep_research: pesquisar informações. Exemplos: "notícias do mercado", "cenário econômico"
- chat: conversa livre, agradecimento, resposta a saudação, perguntas sobre o bot. Exemplos: "obrigado", "valeu", "beleza", "show", "como você funciona?", "o que você é?", "ok", "entendi", "e no mês passado?", "na verdade foi 60", "quem é você?", "pode repetir?"
- introduce: apresentar nome. Exemplos: "meu nome é Guilherme", "me chamo Ana", "pode me chamar de João"
- greeting: saudação. Exemplos: "oi", "olá", "bom dia"
- help: pedido de ajuda. Exemplos: "como usar?", "me ensina", "tutorial"
- correction: correção. Exemplos: "corrigir", "está errado", "não é isso"
- create_category: criar nova categoria. Exemplos: "criar categoria academia", "nova categoria mercado"
- delete_category: excluir categoria. Exemplos: "excluir categoria academia", "apagar categoria mercado"
- list_categories: listar categorias. Exemplos: "minhas categorias", "quais categorias tenho"
- unknown: não identificado

IMPORTANTE:
- "gastos" sozinho (sem verbo como "gastei") é CONSULTA (query_data)
- "Mercado 240", "Uber 30" — padrão descrição+valor — é REGISTRO (register_expense)
- "quanto gastei" é sempre CONSULTA, nunca registro
- "guardei 500 na meta" é CONTRIBUIR META (contribute_goal), não registro de receita
- "obrigado", "valeu", "show" é CHAT, nunca UNKNOWN
- "e no mês passado?" depois de uma consulta é CHAT (follow-up sem contexto explícito)
- "na verdade foi X" é CHAT (correção contextual, não novo registro)"""

    # Injeta histórico da conversa para contexto
    from app.agents.persistence import get_conversation_history
    _history = get_conversation_history(phone_number, limit=4)
    if _history:
        system_prompt += f"\n\nHistórico recente da conversa:\n{_history}"

    try:
        from app.services.llm_service import timed_invoke
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Mensagem: {message}")
        ]

        response, latency_ms = timed_invoke(llm, messages, operation="classify_intent")
        result = JsonOutputParser().parse(response.content)

        intent_str = result.get("intent", "unknown")
        state["intent"] = IntentType(intent_str) if intent_str in [e.value for e in IntentType] else IntentType.UNKNOWN
        state["confidence"] = result.get("confidence", 0.5)

        total_elapsed = (time.time() - start_time) * 1000
        logger.info(f"[classify_intent] LLM fallback: {state['intent']} (LLM={latency_ms:.0f}ms, total={total_elapsed:.0f}ms)")

    except Exception as e:
        total_elapsed = (time.time() - start_time) * 1000
        logger.error(f"[classify_intent] Erro LLM fallback após {total_elapsed:.0f}ms: {e}")
        state["intent"] = IntentType.UNKNOWN
        state["confidence"] = 0.0

    return state
