"""Orchestrator — LangGraph state graph for BagCoin agent orchestration.

Defines the AgentState TypedDict and connects all agent nodes
via LangGraph's StateGraph with conditional routing.
"""

import logging
import re
import unicodedata
from datetime import datetime as dt
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.agents import responses as resp
from app.agents.budget_goal import (
    check_alerts_node,
    contribute_goal_node,
    create_budget_node,
    create_goal_node,
    delete_budget_node,
    delete_goal_node,
    delete_transaction_node,
    query_budgets_node,
    toggle_alerts_node,
    update_budget_node,
    update_goal_node,
    update_transaction_node,
)
from app.agents.deep_research import deep_research
from app.agents.import_statement import import_transactions
from app.agents.ingestion import classify_intent
from app.agents.multimodal import process_multimodal
from app.agents.normalization import extract_transaction
from app.agents.persistence import save_transaction
from app.agents.recommendations import generate_recommendations
from app.agents.reports import generate_report
from app.agents.statement_parser import detect_statement
from app.agents.tenant_context import tenant_phone_error
from app.agents.text_to_sql import process_query
from app.agents.wizard import wizard_node
from app.schemas.enums import IntentType

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    """Estado que trafega pelo grafo LangGraph do BagCoin."""

    phone_number: str
    user_id: int | None
    message: str
    intent: str | None
    extracted_data: dict[str, Any] | None
    query_result: dict[str, Any] | None
    report_path: str | None
    report_summary: str | None
    import_summary: str | None
    imported_count: int | None
    skipped_count: int | None
    import_errors: list | None
    budget_data: dict[str, Any] | None
    goal_data: dict[str, Any] | None
    alerts: list | None
    wizard: dict[str, Any] | None
    response: str | None
    context: dict[str, Any]
    error: str | None
    source_format: str


def process_multimodal_node(state: AgentState) -> AgentState:
    """Nó de processamento de mídia (áudio, imagem, documento)."""
    terr = tenant_phone_error(state.get("phone_number"))
    if terr:
        s = dict(state)
        s["error"] = terr
        return AgentState(**s)
    logger.info(f"Processando mídia: {state.get('source_format', 'text')}")
    result = process_multimodal(dict(state))
    return AgentState(**result)


def import_statement_node(state: AgentState) -> AgentState:
    """Nó de importação de extrato bancário."""
    logger.info("Importando extrato bancário")
    result = import_transactions(dict(state))
    return AgentState(**result)


def classify_intent_node(state: AgentState) -> AgentState:
    """Nó de classificação de intenção."""
    logger.info(
        f"Classificando intenção para: {state['phone_number']} — msg: {state.get('message', '')[:60]}"
    )
    result = classify_intent(dict(state))
    return AgentState(**result)


def extract_data_node(state: AgentState) -> AgentState:
    """Nó de extração de dados financeiros."""
    logger.info("Extraindo dados da mensagem")
    result = extract_transaction(dict(state))
    return AgentState(**result)


def save_transaction_node(state: AgentState) -> AgentState:
    """Nó de persistência de transação."""
    logger.info("Salvando transação no banco")
    result = save_transaction(dict(state))
    return AgentState(**result)


def process_query_node(state: AgentState) -> AgentState:
    """Nó de consulta text-to-SQL."""
    logger.info("Processando consulta")
    result = process_query(dict(state))
    return AgentState(**result)


def generate_report_node(state: AgentState) -> AgentState:
    """Nó de geração de relatório."""
    logger.info("Gerando relatório")
    result = generate_report(dict(state))
    return AgentState(**result)


def generate_recommendations_node(state: AgentState) -> AgentState:
    """Nó de recomendações financeiras."""
    logger.info("Gerando recomendações")
    result = generate_recommendations(dict(state))
    return AgentState(**result)


def deep_research_node(state: AgentState) -> AgentState:
    """Nó de pesquisa aprofundada."""
    logger.info("Realizando pesquisa")
    result = deep_research(dict(state))
    return AgentState(**result)


def budget_node(state: AgentState) -> AgentState:
    """Nó de criação de orçamento."""
    logger.info("Criando orçamento")
    result = create_budget_node(dict(state))
    return AgentState(**result)


def goal_node(state: AgentState) -> AgentState:
    """Nó de criação de meta."""
    logger.info("Criando meta")
    result = create_goal_node(dict(state))
    return AgentState(**result)


def alerts_node(state: AgentState) -> AgentState:
    """Nó de verificação de alertas após transação."""
    logger.info("Verificando alertas")
    result = check_alerts_node(dict(state))
    return AgentState(**result)


def budgets_query_node(state: AgentState) -> AgentState:
    """Nó de consulta de orçamentos/metas."""
    logger.info("Consultando budgets/goals")
    result = query_budgets_node(dict(state))
    return AgentState(**result)


def update_budget_handler_node(state: AgentState) -> AgentState:
    """Nó de atualização de orçamento."""
    logger.info("Atualizando budget")
    result = update_budget_node(dict(state))
    return AgentState(**result)


def contribute_goal_handler_node(state: AgentState) -> AgentState:
    """Nó de contribuição para meta."""
    logger.info("Contribuindo para meta")
    result = contribute_goal_node(dict(state))
    return AgentState(**result)


def delete_goal_handler_node(state: AgentState) -> AgentState:
    """Nó de exclusão de meta."""
    logger.info("Excluindo meta")
    result = delete_goal_node(dict(state))
    return AgentState(**result)


def update_goal_handler_node(state: AgentState) -> AgentState:
    """Nó de atualização de meta."""
    logger.info("Atualizando meta")
    result = update_goal_node(dict(state))
    return AgentState(**result)


def delete_transaction_handler_node(state: AgentState) -> AgentState:
    """Nó de exclusão de transação."""
    logger.info("Excluindo transação")
    result = delete_transaction_node(dict(state))
    return AgentState(**result)


def update_transaction_handler_node(state: AgentState) -> AgentState:
    """Nó de atualização de transação."""
    logger.info("Atualizando transação")
    result = update_transaction_node(dict(state))
    return AgentState(**result)


def update_category_handler_node(state: AgentState) -> AgentState:
    """Nó de renomear categoria."""
    from app.agents.persistence import list_categories, rename_category

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    msg_norm = (
        unicodedata.normalize("NFKD", message.lower()).encode("ASCII", "ignore").decode("ASCII")
    )
    match = re.search(
        r'(?:renomear|mudar nome da|alterar)\s+categoria\s+["\']?(.+?)["\']?\s+(?:para|->)\s+["\']?(.+?)["\']?$',
        msg_norm,
    )
    if match:
        old_name = match.group(1).strip().capitalize()
        new_name = match.group(2).strip().capitalize()
        if rename_category(phone_number, old_name, new_name):
            state["response"] = f"Categoria '{old_name}' renomeada para '{new_name}'."
        else:
            state["response"] = f"Não encontrei a categoria '{old_name}'."
    else:
        cats = list_categories(phone_number)
        user_cats = [c["name"] for c in cats if not c["is_default"]]
        if user_cats:
            state["response"] = (
                "Para renomear, use: 'renomear categoria NOME_ANTIGO para NOVO_NOME'. Categorias: "
                + ", ".join(user_cats)
            )
        else:
            state["response"] = "Você não tem categorias personalizadas para renomear."
    return state


def _msg_norm(message: str) -> str:
    import unicodedata

    return unicodedata.normalize("NFKD", message.lower()).encode("ASCII", "ignore").decode("ASCII")


def create_category_handler_node(state: AgentState) -> AgentState:
    """Nó de criação de categoria."""
    from app.agents.persistence import create_category

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    msg_norm = _msg_norm(message)
    name = None
    for prefix in [
        "criar categoria ",
        "nova categoria ",
        "adicionar categoria ",
        "crie uma categoria ",
    ]:
        if prefix in msg_norm:
            idx = msg_norm.find(prefix) + len(prefix)
            name = message[idx:].strip().capitalize()
            break
    if not name or len(name) < 2:
        state["response"] = "Qual o nome da nova categoria? Ex: 'Criar categoria Academia'"
        return state
    result = create_category(phone_number, name)
    if result is None:
        state["response"] = f"A categoria '{name}' já existe."
    else:
        state["response"] = f"Categoria '{name}' criada com sucesso!"
    return state


def delete_category_handler_node(state: AgentState) -> AgentState:
    """Nó de exclusão de categoria."""
    from app.agents.persistence import delete_category, list_categories

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    msg_norm = _msg_norm(message)
    name = None
    for prefix in ["excluir categoria ", "apagar categoria ", "remover categoria "]:
        if prefix in msg_norm:
            idx = msg_norm.find(prefix) + len(prefix)
            name = message[idx:].strip().capitalize()
            break
    if not name or len(name) < 2:
        cats = list_categories(phone_number)
        user_cats = [c["name"] for c in cats if not c["is_default"]]
        if user_cats:
            state["response"] = "Qual categoria deseja excluir? " + ", ".join(user_cats)
        else:
            state["response"] = "Você não tem categorias personalizadas para excluir."
        return state
    if delete_category(phone_number, name):
        state["response"] = f"Categoria '{name}' removida."
    else:
        state["response"] = (
            f"Não encontrei a categoria '{name}' ou ela é padrão e não pode ser removida."
        )
    return state


def list_categories_handler_node(state: AgentState) -> AgentState:
    """Nó de listagem de categorias."""
    from app.agents.persistence import list_categories

    phone_number = state.get("phone_number", "")
    cats = list_categories(phone_number)
    if not cats:
        state["response"] = "Você não tem categorias ainda."
        return state
    default_cats = [c["name"] for c in cats if c["is_default"]]
    user_cats = [c["name"] for c in cats if not c["is_default"]]
    lines = ["Suas categorias:"]
    if default_cats:
        lines.append("\nPadrão: " + ", ".join(default_cats))
    if user_cats:
        lines.append("\nPersonalizadas: " + ", ".join(user_cats))
    state["response"] = "".join(lines)
    return state


def intro_handler_node(state: AgentState) -> AgentState:
    """Nó de introdução do usuário (nome)."""
    import re as regex

    from app.agents.persistence import save_user_name

    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    patterns = [
        r"(?:meu nome [eé]|me chamo|pode me chamar de|eu sou o|eu sou a)\s+([a-zA-ZÀ-ÿ]+)",
    ]
    name = None
    for p in patterns:
        m = regex.search(p, message, regex.IGNORECASE)
        if m:
            name = m.group(1).strip().capitalize()
            break
    if name:
        save_user_name(phone_number, name)
        state["response"] = f"Prazer em conhecer você, {name}! Como posso ajudar?"
    else:
        state["response"] = "Prazer em conhecer você! Como posso ajudar?"
    return state


def correction_handler_node(state: AgentState) -> AgentState:
    """Nó de correção de transação — suporta valor, categoria, descrição."""
    import re as regex

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")

    # 1. Correção de valor: "R$ 50" ou "na verdade foi R$ 60"
    amount_match = regex.search(
        r"R?\$\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d+(?:[.,]\d{1,2})?)", message
    )
    if amount_match:
        return update_transaction_handler_node(state)

    # 2. Correção de categoria: "era Alimentação" / "categoria certa é Transporte"
    msg_lower = message.lower()
    cat_match = regex.search(
        r"(?:era|categoria\s+(?:certa|correta)\s+[ée])\s+([a-zA-ZÀ-ÿ\s]+)", msg_lower
    )
    if not cat_match:
        cat_match = regex.search(
            r"(?:corrige|muda)\s+(?:a\s+)?categoria\s+(?:para|como)\s+([a-zA-ZÀ-ÿ\s]+)", msg_lower
        )
    if cat_match:
        state["extracted_data"] = {
            "category_name": cat_match.group(1).strip().capitalize()
        }
        return update_transaction_handler_node(state)

    # 3. Correção de descrição: "o nome é Mercado" / "descrição certa é Padaria"
    desc_match = regex.search(r"(?:o\s+)?nome\s+(?:[ée]|certo\s+[ée])\s+(.+)", msg_lower)
    if not desc_match:
        desc_match = regex.search(r"descrição\s+(?:certa\s+)?[ée]\s+(.+)", msg_lower)
    if desc_match:
        state["extracted_data"] = {
            "description": desc_match.group(1).strip().capitalize()
        }
        return update_transaction_handler_node(state)

    # Fallback: pergunta o que corrigir
    state["response"] = (
        "O que você quer corrigir?\n"
        "• Valor: 'era R$ 60'\n"
        "• Categoria: 'era Alimentação'\n"
        "• Descrição: 'o nome é Mercado'"
    )
    return state


def delete_budget_handler_node(state: AgentState) -> AgentState:
    """Nó de exclusão de orçamentos."""
    logger.info("Excluindo budgets")
    result = delete_budget_node(dict(state))
    return AgentState(**result)


def toggle_alerts_handler_node(state: AgentState) -> AgentState:
    """Nó de ativar/desativar alertas."""
    logger.info("Toggling alerts")
    result = toggle_alerts_node(dict(state))
    return AgentState(**result)


def wizard_handler_node(state: AgentState) -> AgentState:
    """Nó de wizard multi-turno para orçamentos, metas, etc."""
    logger.info("Executando wizard")
    result = wizard_node(dict(state))
    return AgentState(**result)


def chat_node(state: AgentState) -> AgentState:
    """Nó conversacional — responde com LLM usando histórico da conversa.

    Usado para:
    - Agradecimentos e conversa casual
    - Follow-ups sem contexto explícito ("E no mês passado?")
    - Correções contextuais ("Na verdade foi R$ 60")
    - Quando a intenção é CHAT, HELP ou UNKNOWN
    - Saudações com contexto
    """
    from datetime import datetime

    from langchain_core.messages import HumanMessage, SystemMessage

    from app.agents.persistence import get_conversation_history
    from app.services.llm_service import get_llm, timed_invoke

    phone_number = state.get("phone_number", "")
    message = state.get("message", "")
    intent = state.get("intent")

    # Se for HELP, tenta responder especificamente com LLM
    if intent == IntentType.HELP.value:
        from langchain_core.messages import HumanMessage, SystemMessage

        from app.agents.prompts.chat import HELP_SPECIFIC_PROMPT
        from app.services.llm_service import get_llm, timed_invoke

        llm = get_llm(temperature=0.3)
        if llm:
            prompt = HELP_SPECIFIC_PROMPT
            try:
                msgs = [SystemMessage(content=prompt), HumanMessage(content=message)]
                r, _ = timed_invoke(llm, msgs, operation="help_response")
                state["response"] = r.content[:1000]
                logger.info(f"[chat_node] HELP específico gerado em resposta a: {message[:50]}")
                return state
            except Exception as e:
                logger.warning(f"[chat_node] HELP via LLM falhou: {e}")
        # Fallback: menu completo
        from app.agents import responses as resp

        state["response"] = resp.help_menu()
        return state

    if intent == IntentType.INTRODUCE.value:
        state["response"] = "Prazer em conhecer você! Como posso ajudar hoje?"
        return state

    # Tenta usar LLM com histórico
    llm = get_llm(temperature=0.7)
    history = get_conversation_history(phone_number, limit=6)

    if not llm:
        # Fallback sem LLM — respostas simples
        msg_lower = message.lower()

        # Saudação sem contexto
        greeting_words = [
            "oi",
            "ola",
            "hello",
            "hey",
            "eai",
            "salve",
            "bom dia",
            "boa tarde",
            "boa noite",
            "eae",
            "iai",
        ]
        if any(w in msg_lower for w in greeting_words):
            from datetime import datetime as dt

            hour = dt.utcnow().hour
            if hour < 12:
                gt = "Bom dia"
            elif hour < 18:
                gt = "Boa tarde"
            else:
                gt = "Boa noite"
            state["response"] = (
                f"{gt}! Sou o BagCoin, seu assistente financeiro. Como posso ajudar?"
            )
            return state

        thanks_words = [
            "obrigado",
            "obrigada",
            "valeu",
            "brigado",
            "thanks",
            "show",
            "beleza",
            "top",
        ]
        if any(w in msg_lower for w in thanks_words):
            state["response"] = "Por nada! Se precisar de algo, é só chamar."
            return state

        if any(
            w in msg_lower for w in ["ok", "certo", "entendi", "tendi", "blz", "perfeito", "legal"]
        ):
            state["response"] = "Show! O que mais posso ajudar?"
            return state

        # Follow-up detection
        if msg_lower.startswith("e ") or msg_lower.startswith("e,"):
            state["response"] = (
                "Pode repetir a pergunta completa? Assim fica mais fácil de entender "
                "o que você quer consultar. Ex: 'Quanto gastei no mês passado?'"
            )
            return state

        # Correção contextual
        import re as regex

        if any(
            w in msg_lower for w in ["na verdade", "era na verdade", "corrigindo", "foi na verdade"]
        ):
            amount_match = regex.search(r"R?\$?\s*(\d+(?:[.,]\d{1,2})?)", message)
            if amount_match:
                state["response"] = (
                    "Entendi, vou ajustar! Qual transação quer corrigir? "
                    "Pode me dar mais detalhes (descrição, data)?"
                )
                return state

        # Para UNKNOWN e HELP, tenta responder algo útil
        if any(
            w in msg_lower
            for w in [
                "quem",
                "o que",
                "como voce",
                "que é",
                "que e",
                "sabe fazer",
                "pode fazer",
                "capacidade",
                "funcionalidade",
            ]
        ):
            from app.agents import responses as resp

            state["response"] = (
                "Sou o **BagCoin**, seu assistente financeiro! 💰\n\n"
                "Posso ajudar com:\n"
                "• **Registrar** gastos e receitas\n"
                "• **Consultar** seus dados financeiros\n"
                "• **Orçamentos** por categoria\n"
                "• **Metas** financeiras\n"
                "• **Relatórios** em PDF\n"
                "• **Importar** extratos bancários\n"
                "• **Dicas** de economia\n\n"
                "Manda **'ajuda'** pra ver exemplos de como usar cada função!"
            )
            return state

        state["response"] = (
            "Não entendi muito bem. Posso ajudar com:\n"
            "- Registrar gastos e receitas\n"
            "- Consultar seus dados\n"
            "- Gerar relatórios\n"
            "- Criar orçamentos e metas\n\n"
            "Manda 'ajuda' para ver exemplos ou me faça uma pergunta!"
        )
        return state

    # Usa LLM — mesmo sem histórico ele consegue responder bem
    history = get_conversation_history(phone_number, limit=6)

    # Tem LLM — resposta inteligente
    from app.agents.prompts.chat import build_chat_prompt

    hour = datetime.utcnow().hour
    if hour < 12:
        greeting = "Bom dia"
    elif hour < 18:
        greeting = "Boa tarde"
    else:
        greeting = "Boa noite"

    system_prompt = build_chat_prompt(greeting=greeting, history=history)

    try:
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=message)]

        response, latency_ms = timed_invoke(llm, messages, operation="chat_node")
        state["response"] = response.content

        logger.info(f"[chat_node] Resposta gerada em {latency_ms:.0f}ms")

    except Exception as e:
        logger.error(f"[chat_node] Erro: {e}")
        state["response"] = (
            "Entendi! Se precisar registrar algo ou consultar dados, pode me falar que eu ajudo."
        )

    return state


def build_response_node(state: AgentState) -> AgentState:
    """Nó de construção da resposta final."""
    from app.agents.persistence import get_or_create_user
    from app.db.session import sync_session_maker

    intent = state.get("intent")
    error = state.get("error")
    message = state.get("message", "")
    phone_number = state.get("phone_number", "")

    if message.startswith("[") and message.endswith("]"):
        state["response"] = message[1:-1]
        _save_history(phone_number, message, state.get("response", ""))
        return state

    if error:
        state["response"] = resp.error_message(error)
        _save_history(phone_number, message, state.get("response", ""))
        return state

    if state.get("response"):
        _save_history(phone_number, message, state.get("response", ""))
        return state

    if intent == IntentType.REGISTER_EXPENSE.value or intent == IntentType.REGISTER_INCOME.value:
        extracted = state.get("extracted_data", {})
        tx_type = extracted.get("type", "EXPENSE")
        amount = extracted.get("amount", 0)
        category = state.get("category_name", extracted.get("category", "Outros"))
        desc = extracted.get("description", "")

        state["response"] = resp.transaction_registered(tx_type, amount, category, desc)

        alerts = state.get("alerts", [])
        if alerts:
            alert_texts = [a["message"] for a in alerts]
            state["response"] += "\n\n" + "\n".join(alert_texts)

        if tx_type == "INCOME":
            db = sync_session_maker()
            try:
                user = get_or_create_user(phone_number, db)
                from app.services.budget_service import get_goals

                goals = get_goals(phone_number)
                active_goals = [g for g in goals if g.get("status") == "active"]
                if active_goals:
                    goal_names = ", ".join([g["title"] for g in active_goals[:3]])
                    state["response"] += (
                        f"\n\nQuer direcionar parte para alguma meta? Você tem: {goal_names}"
                    )
            except Exception:
                pass
            finally:
                db.close()

    elif intent == IntentType.QUERY_DATA.value:
        query_result = state.get("query_result", {})
        if query_result and query_result.get("summary"):
            state["response"] = query_result["summary"]
        else:
            state["response"] = "Não encontrei dados para sua consulta."

    elif intent == IntentType.GENERATE_REPORT.value:
        summary = state.get("report_summary", "Relatório gerado com sucesso!")
        state["response"] = summary

    elif intent == IntentType.GREETING.value:
        db = sync_session_maker()
        try:
            user = get_or_create_user(phone_number, db)
            name = user.name if hasattr(user, "name") and user.name else None
        except Exception:
            name = None
        finally:
            db.close()
        hour = dt.utcnow().hour
        if hour < 12:
            greeting_time = "Bom dia"
        elif hour < 18:
            greeting_time = "Boa tarde"
        else:
            greeting_time = "Boa noite"
        state["response"] = resp.greeting(name=name, greeting_time=greeting_time)

    elif intent == IntentType.INTRODUCE.value:
        pass

    elif intent == IntentType.HELP.value:
        state["response"] = resp.help_menu()

    elif intent == IntentType.CREATE_BUDGET.value:
        if not state.get("response"):
            state["response"] = (
                "Para criar um orçamento, me diga algo como:\n"
                "• Orçamento de R$ 3000 para alimentação\n"
                "• Limite de R$ 800 para transporte"
            )

    elif intent == IntentType.CREATE_GOAL.value:
        if not state.get("response"):
            state["response"] = (
                "Para criar uma meta, me diga algo como:\n"
                "• Quero guardar R$ 5000 para viagem\n"
                "• Meta de reserva de emergência: R$ 10000"
            )

    elif intent == IntentType.IMPORT_STATEMENT.value:
        if state.get("import_summary"):
            state["response"] = state["import_summary"]
        else:
            state["response"] = (
                "Para importar seu extrato, envie o arquivo diretamente aqui:\n"
                "• PDF do banco\n"
                "• CSV (Excel)\n"
                "• Arquivo OFX\n\n"
                "Suporto extratos do Nubank, Itaú, Bradesco, Caixa e outros.\n"
                "Assim que enviar, importo automaticamente suas transações!"
            )

    elif state.get("import_summary"):
        state["response"] = state["import_summary"]

    else:
        # Fallback final — tenta usar LLM para responder
        from langchain_core.messages import HumanMessage, SystemMessage

        from app.services.llm_service import get_llm, timed_invoke

        llm = get_llm(temperature=0.7)
        if llm:
            try:
                msgs = [
                    SystemMessage(
                        content="Você é o BagCoin, assistente financeiro. Responda de forma breve e útil."
                    ),
                    HumanMessage(content=message),
                ]
                r, _ = timed_invoke(llm, msgs, operation="build_response")
                state["response"] = r.content[:500]
            except Exception:
                state["response"] = resp.unknown_intent()
        else:
            state["response"] = resp.unknown_intent()

    _save_history(phone_number, message, state.get("response", ""))
    return state


def _save_history(phone_number: str, user_msg: str, bot_msg: str):
    """Salva par de mensagens no histórico."""
    try:
        save_message_to_history(phone_number, "user", user_msg)
        save_message_to_history(phone_number, "bot", bot_msg)
    except Exception:
        pass


def route_after_multimodal(state: AgentState) -> str:
    """Roteia após processamento multimodal:
    - Se detectar extrato bancário, vai para import_statement
    - Senão, vai para classify_intent (ponto de entrada unificado)
    """
    error = state.get("error")
    if error:
        return "build_response"
    if state.get("source_format") == "document" and detect_statement(dict(state)):
        logger.info("Extrato bancário detectado. Roteando para importação.")
        return "import_statement"
    return "classify_intent"


def route_by_intent(state: AgentState) -> str:
    """Roteia para o próximo nó baseado na intenção."""
    intent = state.get("intent")
    error = state.get("error")

    if error:
        return "build_response"

    routing_map = {
        IntentType.REGISTER_EXPENSE.value: "extract_data",
        IntentType.REGISTER_INCOME.value: "extract_data",
        IntentType.QUERY_DATA.value: "process_query",
        IntentType.GENERATE_REPORT.value: "generate_report",
        IntentType.RECOMMENDATION.value: "generate_recommendations",
        IntentType.DEEP_RESEARCH.value: "deep_research",
        IntentType.IMPORT_STATEMENT.value: "build_response",
        IntentType.GREETING.value: "chat",
        IntentType.INTRODUCE.value: "chat",
        IntentType.HELP.value: "chat",
        IntentType.CHAT.value: "chat",
        IntentType.CREATE_BUDGET.value: "wizard",
        IntentType.CREATE_GOAL.value: "wizard",
        IntentType.CONTRIBUTE_GOAL.value: "contribute_goal",
        IntentType.DELETE_BUDGET.value: "delete_budget",
        IntentType.UPDATE_BUDGET.value: "update_budget",
        IntentType.DELETE_GOAL.value: "delete_goal",
        IntentType.UPDATE_GOAL.value: "update_goal",
        IntentType.DELETE_TRANSACTION.value: "delete_transaction",
        IntentType.UPDATE_TRANSACTION.value: "update_transaction",
        IntentType.CORRECTION.value: "correction",
        IntentType.TOGGLE_ALERTS.value: "toggle_alerts",
        IntentType.CREATE_CATEGORY.value: "create_category",
        IntentType.DELETE_CATEGORY.value: "delete_category",
        IntentType.LIST_CATEGORIES.value: "list_categories",
        IntentType.UPDATE_CATEGORY.value: "update_category",
        IntentType.UNKNOWN.value: "chat",
    }

    # Consultas de budgets/goals também caem em QUERY_DATA — detectamos aqui
    msg_lower = state.get("message", "").lower()
    msg_norm = unicodedata.normalize("NFKD", msg_lower).encode("ASCII", "ignore").decode("ASCII")
    if intent == IntentType.QUERY_DATA.value:
        if any(
            w in msg_norm
            for w in [
                "orcamento",
                "orcamentos",
                "budget",
                "limite",
                "meta",
                "metas",
                "objetivo",
                "objetivos",
                "goal",
            ]
        ):
            return "query_budgets"

    return routing_map.get(intent, "build_response")


def create_orchestrator():
    """Cria e retorna o grafo de orquestração LangGraph."""
    workflow = StateGraph(AgentState)

    # Adiciona nós
    workflow.add_node("process_multimodal", process_multimodal_node)
    workflow.add_node("classify_intent", classify_intent_node)
    workflow.add_node("extract_data", extract_data_node)
    workflow.add_node("save_transaction", save_transaction_node)
    workflow.add_node("check_alerts", alerts_node)
    workflow.add_node("process_query", process_query_node)
    workflow.add_node("generate_report", generate_report_node)
    workflow.add_node("generate_recommendations", generate_recommendations_node)
    workflow.add_node("deep_research", deep_research_node)
    workflow.add_node("import_statement", import_statement_node)
    workflow.add_node("create_budget", budget_node)
    workflow.add_node("create_goal", goal_node)
    workflow.add_node("query_budgets", budgets_query_node)
    workflow.add_node("delete_budget", delete_budget_handler_node)
    workflow.add_node("update_budget", update_budget_handler_node)
    workflow.add_node("contribute_goal", contribute_goal_handler_node)
    workflow.add_node("delete_goal", delete_goal_handler_node)
    workflow.add_node("update_goal", update_goal_handler_node)
    workflow.add_node("delete_transaction", delete_transaction_handler_node)
    workflow.add_node("update_transaction", update_transaction_handler_node)
    workflow.add_node("introduce", intro_handler_node)
    workflow.add_node("correction", correction_handler_node)
    workflow.add_node("toggle_alerts", toggle_alerts_handler_node)
    workflow.add_node("wizard", wizard_handler_node)
    workflow.add_node("chat", chat_node)
    workflow.add_node("create_category", create_category_handler_node)
    workflow.add_node("delete_category", delete_category_handler_node)
    workflow.add_node("list_categories", list_categories_handler_node)
    workflow.add_node("update_category", update_category_handler_node)
    workflow.add_node("build_response", build_response_node)

    # Define fluxo
    # 1. Sempre processa multimodal primeiro (se for texto, passa direto)
    workflow.set_entry_point("process_multimodal")

    workflow.add_conditional_edges(
        "process_multimodal",
        route_after_multimodal,
        {
            "classify_intent": "classify_intent",
            "import_statement": "import_statement",
            "build_response": "build_response",
        },
    )

    # 2. Classifica intenção do texto (original ou extraído da mídia)
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "extract_data": "extract_data",
            "process_query": "process_query",
            "generate_report": "generate_report",
            "generate_recommendations": "generate_recommendations",
            "deep_research": "deep_research",
            "create_budget": "create_budget",
            "create_goal": "create_goal",
            "query_budgets": "query_budgets",
            "delete_budget": "delete_budget",
            "update_budget": "update_budget",
            "contribute_goal": "contribute_goal",
            "delete_goal": "delete_goal",
            "update_goal": "update_goal",
            "delete_transaction": "delete_transaction",
            "update_transaction": "update_transaction",
            "introduce": "introduce",
            "correction": "correction",
            "toggle_alerts": "toggle_alerts",
            "wizard": "wizard",
            "chat": "chat",
            "create_category": "create_category",
            "delete_category": "delete_category",
            "list_categories": "list_categories",
            "update_category": "update_category",
            "build_response": "build_response",
        },
    )

    workflow.add_edge("extract_data", "save_transaction")
    workflow.add_edge("save_transaction", "check_alerts")
    workflow.add_edge("check_alerts", "build_response")
    workflow.add_edge("process_query", "build_response")
    workflow.add_edge("generate_report", "build_response")
    workflow.add_edge("generate_recommendations", "build_response")
    workflow.add_edge("deep_research", "build_response")
    workflow.add_edge("import_statement", "build_response")
    workflow.add_edge("create_budget", "build_response")
    workflow.add_edge("create_goal", "build_response")
    workflow.add_edge("query_budgets", "build_response")
    workflow.add_edge("delete_budget", "build_response")
    workflow.add_edge("update_budget", "build_response")
    workflow.add_edge("contribute_goal", "build_response")
    workflow.add_edge("delete_goal", "build_response")
    workflow.add_edge("update_goal", "build_response")
    workflow.add_edge("delete_transaction", "build_response")
    workflow.add_edge("update_transaction", "build_response")
    workflow.add_edge("introduce", "build_response")
    workflow.add_edge("correction", "build_response")
    workflow.add_edge("toggle_alerts", "build_response")
    workflow.add_edge("wizard", "build_response")
    workflow.add_edge("chat", "build_response")
    workflow.add_edge("create_category", "build_response")
    workflow.add_edge("delete_category", "build_response")
    workflow.add_edge("list_categories", "build_response")
    workflow.add_edge("update_category", "build_response")
    workflow.add_edge("build_response", END)

    return workflow.compile()


# Instância global do orquestrador
orchestrator = create_orchestrator()
