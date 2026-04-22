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
from ..database import init_db, engine
from ..agents.graph import graph
from ..logging_config import logger
from ..metrics import agent_messages_processed_total, agent_processing_duration_seconds
from ..celery_app import celery_app

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
    from sqlmodel import Session, select
    from ..models import User

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

    user_id = None
    user_name = pushname or "Usuário"
    is_new_user = False

    with Session(engine) as session:
        statement = select(User).where(User.whatsapp_number == chat_id)
        user = session.exec(statement).first()

        if not user:
            user = User(
                whatsapp_number=chat_id,
                name=user_name,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            user_id = user.id
            is_new_user = True
            logger.info("user_auto_created", user_id=user_id, name=user_name, chat_id=chat_id)
        else:
            user_id = user.id
            if pushname and (not user.name or user.name == "Usuário"):
                user.name = pushname
                session.add(user)
                session.commit()
                logger.info("user_name_updated", user_id=user_id, name=pushname)

    config = {"configurable": {"thread_id": f"{platform}:{chat_id}"}}
    content = message_text or f"[Anexo {file_type}]"

    cache_key = None
    if message_text and not file_bytes_b64:
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

    initial_state = {
        "messages": [HumanMessage(content=content)],
        "whatsapp_number": chat_id,
        "file_bytes": file_bytes,
        "file_type": file_type,
        "user_id": user_id,
        "pushname": pushname,
        "is_group": False,
    }

    start = time.time()
    try:
        final_state = graph.invoke(initial_state, config=config)
        agent_processing_duration_seconds.observe(time.time() - start)
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
        agent_processing_duration_seconds.observe(time.time() - start)
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
