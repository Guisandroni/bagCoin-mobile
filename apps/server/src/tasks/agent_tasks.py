import os
import base64
import json
import hashlib
import time
from datetime import datetime
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from langchain_core.messages import HumanMessage

from ..config import settings
from ..core.database import engine, init_db
from ..core.logging import logger
from ..core.metrics import agent_messages_processed_total, agent_processing_duration_seconds
from ..core.auth import is_token_valid
from ..agents.graph import graph
from ..celery_app import celery_app
from ..repositories.conversation_context_repository import ConversationContextRepository
from sqlmodel import Session

redis_cache = None
try:
    import redis
    redis_cache = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_cache.ping()
    logger.info("redis_cache_connected_in_worker")
except Exception:
    logger.warning("redis_cache_not_available_in_worker")


def _get_cache_key(chat_id: str, message_text: str) -> str:
    content = f"{chat_id}:{message_text}"
    return f"agent:response:{hashlib.md5(content.encode()).hexdigest()}"


def _get_cached_response(cache_key: str):
    if not redis_cache:
        return None
    try:
        cached = redis_cache.get(cache_key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    return None


def _set_cached_response(cache_key: str, response_text: str, ttl: int = 300):
    if not redis_cache:
        return
    try:
        redis_cache.setex(
            cache_key,
            ttl,
            json.dumps({"response": response_text, "cached_at": datetime.utcnow().isoformat()}),
        )
    except Exception:
        pass


def _has_active_conversational_context(ctx) -> bool:
    """Return True if the user is in the middle of a multi-turn conversation."""
    if ctx is None:
        return False
    return (
        ctx.awaiting_budget_month
        or ctx.awaiting_fund_field is not None
        or ctx.awaiting_file_type
        or ctx.pending_budget_category is not None
        or ctx.pending_fund is not None
    )


def _invalidate_chat_cache(chat_id: str):
    """Delete all cached responses for a given chat_id."""
    if not redis_cache:
        return
    try:
        pattern = f"agent:response:*"
        for key in redis_cache.scan_iter(match=pattern):
            redis_cache.delete(key)
        logger.info("chat_cache_invalidated", chat_id=chat_id)
    except Exception:
        pass


def _load_context_into_state(ctx) -> dict:
    """Build state overrides from persistent conversation context."""
    if ctx is None:
        return {}
    return {
        "awaiting_budget_month": ctx.awaiting_budget_month,
        "pending_budget_category": ctx.pending_budget_category,
        "pending_budget_amount": ctx.pending_budget_amount,
        "awaiting_fund_field": ctx.awaiting_fund_field,
        "pending_fund": ctx.pending_fund,
        "awaiting_file_type": ctx.awaiting_file_type,
        "pending_file_bytes": ctx.pending_file_bytes,
        "pending_file_type": ctx.pending_file_type,
        "last_intent": ctx.last_intent,
        "last_action": ctx.last_action,
    }


def _save_context_from_state(ctx_repo: ConversationContextRepository, ctx, final_state: dict):
    """Persist follow-up flags from the final graph state back to the database."""
    if ctx is None:
        return

    ctx.awaiting_budget_month = final_state.get("awaiting_budget_month", False)
    ctx.pending_budget_category = final_state.get("pending_budget_category")
    ctx.pending_budget_amount = final_state.get("pending_budget_amount")
    ctx.awaiting_fund_field = final_state.get("awaiting_fund_field")
    ctx.pending_fund = final_state.get("pending_fund")
    ctx.awaiting_file_type = final_state.get("awaiting_file_type", False)
    ctx.pending_file_bytes = final_state.get("pending_file_bytes")
    ctx.pending_file_type = final_state.get("pending_file_type")
    ctx.last_intent = final_state.get("intent") or final_state.get("last_intent")
    ctx.last_action = final_state.get("last_action")

    ctx_repo.update(ctx)


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=60,
)
def process_agent_message_task(
    self,
    chat_id: str,
    platform: str,
    message_text: str = None,
    file_bytes_b64: str = None,
    file_type: str = None,
    pushname: str = None,
):
    from ..models.user import User

    try:
        init_db()
    except Exception:
        pass

    logger.info(
        "processing_agent_message",
        platform=platform,
        chat_id=chat_id,
        message_type=file_type or "text",
        pushname=pushname,
    )

    with Session(engine) as session:
        from sqlmodel import select
        statement = select(User).where(User.whatsapp_number == chat_id)
        user = session.exec(statement).first()

    # Se usuário não existe ou não está ativo → mensagem de boas-vindas/unauthorized
    if not user or not user.is_active:
        _send_unauthorized_message(chat_id, pushname)
        return {"status": "unauthorized", "chat_id": chat_id}

    # Se token expirou → pedir reativação
    if not is_token_valid(user):
        msg = (
            "Olá! Seu acesso expirou após 7 dias. "
            "Para continuar usando o Assistente Financeiro, acesse a plataforma web e gere um novo código de ativação."
        )
        try:
            send_whatsapp_message_sync(chat_id, msg)
        except Exception as ex:
            logger.error("error_sending_expired_message", error=str(ex), chat_id=chat_id)
        return {"status": "token_expired", "chat_id": chat_id}

    user_id = user.id
    user_name = user.name or pushname or "Usuário"

    config = {"configurable": {"thread_id": f"{platform}:{chat_id}"}}
    content = message_text or f"[Anexo {file_type}]"

    # Load persistent conversational context
    with Session(engine) as session:
        ctx_repo = ConversationContextRepository(session)
        ctx = ctx_repo.get_or_create(user_id)
        context_state = _load_context_into_state(ctx)
        has_active_context = _has_active_conversational_context(ctx)

    # Only use Redis cache when NOT in the middle of a follow-up conversation
    cache_key = None
    if message_text and not file_bytes_b64 and not has_active_context:
        cache_key = _get_cache_key(chat_id, message_text)
        cached = _get_cached_response(cache_key)
        if cached:
            logger.info("cache_hit", chat_id=chat_id)
            response_text = cached["response"]
            if platform == "whatsapp":
                try:
                    send_whatsapp_message_sync(chat_id, response_text)
                except Exception as ex:
                    logger.error("error_sending_cached_message", error=str(ex), chat_id=chat_id)
            return {"status": "success", "chat_id": chat_id, "cached": True}

    file_bytes = None
    if file_bytes_b64:
        file_bytes = base64.b64decode(file_bytes_b64)

    # Merge persistent context into initial state so the graph sees follow-up flags
    initial_state = {
        "messages": [HumanMessage(content=content)],
        "whatsapp_number": chat_id,
        "file_bytes": file_bytes,
        "file_type": file_type,
        "user_id": user_id,
        "pushname": user_name,
    }
    initial_state.update(context_state)

    start = time.time()
    try:
        final_state = graph.invoke(initial_state, config=config)
        agent_processing_duration_seconds.labels(platform=platform).observe(time.time() - start)

        # Persist any follow-up flags back to the database
        with Session(engine) as session:
            ctx_repo = ConversationContextRepository(session)
            ctx = ctx_repo.get_or_create(user_id)
            _save_context_from_state(ctx_repo, ctx, final_state)
            # If we just entered or exited a follow-up, invalidate cache to prevent stale hits
            if _has_active_conversational_context(ctx):
                _invalidate_chat_cache(chat_id)

        pdf_bytes = final_state.get("report_pdf_bytes")

        if pdf_bytes:
            filename = f"Relatorio_{datetime.now().strftime('%Y%m%d')}.pdf"
            with open(filename, "wb") as f:
                f.write(pdf_bytes)

            if platform == "whatsapp":
                try:
                    base64_file = base64.b64encode(pdf_bytes).decode("utf-8")
                    send_whatsapp_file_sync(chat_id, base64_file, filename, "Aqui está seu relatório financeiro.")
                    logger.info("pdf_sent", chat_id=chat_id)
                except Exception as ex:
                    logger.error("error_sending_pdf", error=str(ex), chat_id=chat_id)
            os.remove(filename)
        else:
            response_text = final_state["messages"][-1].content

            if cache_key:
                _set_cached_response(cache_key, response_text)
                logger.info("response_cached", chat_id=chat_id, cache_key=cache_key)

            if platform == "whatsapp":
                try:
                    send_whatsapp_message_sync(chat_id, response_text)
                    logger.info("message_sent", chat_id=chat_id)
                except Exception as ex:
                    logger.error("error_sending_message", error=str(ex), chat_id=chat_id)

        agent_messages_processed_total.labels(platform=platform, status="success").inc()
        return {"status": "success", "chat_id": chat_id}

    except Exception as e:
        agent_processing_duration_seconds.labels(platform=platform).observe(time.time() - start)
        agent_messages_processed_total.labels(platform=platform, status="error").inc()
        logger.error("error_processing_agent", error=str(e), chat_id=chat_id, exc_info=True)

        error_msg = "Desculpe, tive um problema ao processar seu pedido."
        if platform == "whatsapp":
            try:
                send_whatsapp_message_sync(chat_id, error_msg)
            except Exception:
                pass

        try:
            raise self.retry(exc=e)
        except MaxRetriesExceededError:
            logger.error("max_retries_exceeded", chat_id=chat_id)
            return {"status": "failed", "error": str(e)}


def _send_unauthorized_message(chat_id: str, pushname: str = None):
    name = pushname or "amigo"
    msg = (
        f"Olá, {name}! Sou seu Assistente Financeiro Pessoal. Estou aqui para ajudar você a organizar seus gastos, "
        f"acompanhar seu orçamento e tomar melhores decisões financeiras.\n\n"
        f"*O que eu posso fazer por você:*\n\n"
        f"1. *Registrar Gastos e Ganhos*\n"
        f"   Basta me enviar uma mensagem simples. Exemplos:\n"
        f"   - \"Gastei 45 no mercado\" → Registro em Alimentação\n"
        f"   - \"Uber pra casa 12 reais\" → Registro em Transporte\n"
        f"   - \"Salário caiu 5000\" → Registro em Receita\n\n"
        f"2. *Consultar Seus Dados*\n"
        f"   Pergunte sobre seus gastos a qualquer momento:\n"
        f"   - \"Quanto gastei esse mês?\"\n"
        f"   - \"Qual meu maior gasto?\"\n"
        f"   - \"Gastos de saúde nos últimos 3 meses\"\n\n"
        f"3. *Orçamentos e Fundos*\n"
        f"   Defina limites de gastos e metas de economia:\n"
        f"   - \"Definir 5000 para alimentação\" → Cria orçamento mensal\n"
        f"   - \"Criar fundo Viagem Disney\" → Guarda dinheiro para uma meta\n"
        f"   - \"Como está meu orçamento?\" → Mostra progresso\n\n"
        f"4. *Lembretes e Assinaturas*\n"
        f"   Organize contas a pagar e gastos fixos:\n"
        f"   - \"Me lembra de pagar a luz dia 10\"\n"
        f"   - \"Registrar assinatura Netflix 39\"\n\n"
        f"5. *Lista de Compras*\n"
        f"   Anote itens rapidamente:\n"
        f"   - \"Anota leite, pão, ovos\"\n\n"
        f"6. *Importar Extratos*\n"
        f"   Envie um PDF, CSV ou OFX do seu banco que eu extraio automaticamente todos os lançamentos.\n\n"
        f"7. *Análise e Recomendações*\n"
        f"   Posso analisar seus hábitos de consumo e dar dicas personalizadas para economizar.\n\n"
        f"*Para começar:* Acesse nossa plataforma web, cadastre-se e envie o código de ativação aqui. "
        f"O código é válido por 7 dias.\n\n"
        f"Estou pronto para ajudar! 💪"
    )
    try:
        send_whatsapp_message_sync(chat_id, msg)
    except Exception as ex:
        logger.error("error_sending_unauthorized", error=str(ex), chat_id=chat_id)


def send_whatsapp_message_sync(chat_id: str, text: str):
    import urllib.request
    import urllib.error

    bridge_url = getattr(settings, "WHATSAPP_BRIDGE_URL", "http://localhost:3002")
    url = f"{bridge_url}/send-message"
    data = json.dumps({"chatId": chat_id, "text": text}).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise Exception(f"Failed to send message: {resp.status}")


def send_whatsapp_file_sync(chat_id: str, base64_file: str, filename: str, caption: str = None):
    import urllib.request
    import urllib.error

    bridge_url = getattr(settings, "WHATSAPP_BRIDGE_URL", "http://localhost:3002")
    url = f"{bridge_url}/send-file"
    data = json.dumps({
        "chatId": chat_id,
        "base64File": base64_file,
        "filename": filename,
        "caption": caption or "",
    }).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise Exception(f"Failed to send file: {resp.status}")
