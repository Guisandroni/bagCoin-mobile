import asyncio
import os
import base64
import secrets
import string
import time
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from langchain_core.messages import HumanMessage
from sqlmodel import Session, select
from .config import settings
from .database import engine
from .agents.graph import graph
from .models import User
from .services.whatsapp_service import send_whatsapp_message, send_whatsapp_file
from .tasks.agent_tasks import process_agent_message_task
from .logging_config import logger
from .metrics import (
    webhook_requests_total,
    agent_messages_processed_total,
    pre_register_total,
    webhook_latency_seconds,
    metrics_response,
)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Agent Financeiro Multi-Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(
        "incoming_request",
        method=request.method,
        path=request.url.path,
        client=get_remote_address(request),
    )
    response = await call_next(request)
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
    )
    return response

green_api = None
try:
    from whatsapp_api_client_python import API
    if settings.GREEN_API_ID_INSTANCE and settings.GREEN_API_TOKEN_INSTANCE:
        green_api = API.GreenAPI(
            settings.GREEN_API_ID_INSTANCE,
            settings.GREEN_API_TOKEN_INSTANCE
        )
except Exception:
    pass

telegram_api = None
if settings.TELEGRAM_ID_INSTANCE and settings.TELEGRAM_TOKEN_INSTANCE:
    try:
        from whatsapp_api_client_python import API
        telegram_api = API.GreenAPI(
            settings.TELEGRAM_ID_INSTANCE,
            settings.TELEGRAM_TOKEN_INSTANCE
        )
    except Exception:
        pass

redis_cache = None
try:
    import redis
    redis_cache = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_cache.ping()
    logger.info("redis_cache_connected")
except Exception as e:
    logger.warning("redis_cache_not_available", error=str(e))


def run_migrations():
    import alembic.config
    import alembic.command
    alembic_cfg = alembic.config.Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic.command.upgrade(alembic_cfg, "head")


@app.on_event("startup")
def on_startup():
    run_migrations()

async def process_agent_message(chat_id: str, platform: str, message_text: str = None, file_bytes: bytes = None, file_type: str = None):
    logger.info(
        "processing_agent_message",
        platform=platform,
        chat_id=chat_id,
        message_type=file_type or "text",
    )
    config = {"configurable": {"thread_id": f"{platform}:{chat_id}"}}
    
    content = message_text or f"[Anexo {file_type}]"
    
    initial_state = {
        "messages": [HumanMessage(content=content)],
        "whatsapp_number": chat_id,
        "file_bytes": file_bytes,
        "file_type": file_type
    }
    
    try:
        final_state = await asyncio.to_thread(graph.invoke, initial_state, config)
        pdf_bytes = final_state.get("report_pdf_bytes")
        api_client = green_api if platform == "whatsapp" else telegram_api

        if pdf_bytes:
            filename = f"Relatorio_{datetime.now().strftime('%Y%m%d')}.pdf"
            with open(filename, "wb") as f:
                f.write(pdf_bytes)
            if platform == "whatsapp":
                try:
                    base64_file = base64.b64encode(pdf_bytes).decode("utf-8")
                    await send_whatsapp_file(chat_id, base64_file, filename, "Aqui está seu relatório financeiro.")
                except Exception as ex:
                    logger.error("error_sending_pdf", error=str(ex), chat_id=chat_id)
                    if api_client:
                        api_client.sending.sendFileByUpload(chat_id, filename, filename, "Aqui está seu relatório financeiro.")
            elif api_client:
                api_client.sending.sendFileByUpload(chat_id, filename, filename, "Aqui está seu relatório financeiro.")
            os.remove(filename)
        else:
            response_text = final_state["messages"][-1].content
            if platform == "whatsapp":
                try:
                    await send_whatsapp_message(chat_id, response_text)
                except Exception as ex:
                    logger.error("error_sending_message", error=str(ex), chat_id=chat_id)
                    if api_client:
                        api_client.sending.sendMessage(chat_id, response_text)
            elif api_client:
                api_client.sending.sendMessage(chat_id, response_text)
        
    except Exception as e:
        logger.error("error_processing_agent", error=str(e), chat_id=chat_id, exc_info=True)
        error_msg = "Desculpe, tive um problema ao processar seu pedido."
        if platform == "whatsapp":
            try:
                await send_whatsapp_message(chat_id, error_msg)
            except Exception:
                if green_api:
                    green_api.sending.sendMessage(chat_id, error_msg)
        elif green_api:
            green_api.sending.sendMessage(chat_id, error_msg)

def generate_random_token(length=8):
    prefix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(3))
    suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
    return f"{prefix}-{suffix}"

@app.get("/metrics")
async def metrics_endpoint():
    data, content_type = metrics_response()
    return Response(content=data, media_type=content_type)

@app.post("/users/pre-register/")
@app.post("/users/pre-register")
@limiter.limit("5/minute")
async def pre_register_user(request: Request, data: dict = None):
    name = (data or {}).get("name", "Usuário")
    
    token = generate_random_token()
    
    with Session(engine) as session:
        new_user = User(
            name=name,
            activation_token=token,
            is_active=False
        )
        session.add(new_user)
        try:
            session.commit()
            session.refresh(new_user)
            logger.info("user_pre_registered", user_id=new_user.id, name=name)
            pre_register_total.labels(status="success").inc()
        except Exception as e:
            session.rollback()
            logger.error("error_pre_registering_user", error=str(e))
            pre_register_total.labels(status="error").inc()
            token = generate_random_token()
            new_user.activation_token = token
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
        
    return {"status": "success", "token": token, "id": new_user.id}

@app.post("/webhook/telegram")
@limiter.limit("30/minute")
async def telegram_webhook(request: Request):
    start = time.time()
    if not telegram_api:
        webhook_requests_total.labels(platform="telegram", status="not_configured").inc()
        return {"status": "telegram_not_configured"}

    body = await request.json()
    type_webhook = body.get("typeWebhook")
    
    chat_id = body.get("senderData", {}).get("chatId")
    if not chat_id:
        webhook_requests_total.labels(platform="telegram", status="ignored").inc()
        return {"status": "ignored"}

    message_text = None
    file_bytes = None
    file_type = None

    if type_webhook == "incomingMessageReceived":
        message_data = body.get("messageData", {})
        type_message = message_data.get("typeMessage")
        
        if type_message == "textMessage":
            message_text = message_data.get("textMessageData", {}).get("textMessage")
        elif type_message == "extendedTextMessage":
            message_text = message_data.get("extendedTextMessageData", {}).get("text")
        elif type_message in ["imageMessage", "audioMessage", "documentMessage"]:
            file_data = message_data.get(f"{type_message}Data", {})
            download_url = file_data.get("downloadUrl")
            caption = file_data.get("caption")
            if caption: message_text = caption

            if download_url:
                import httpx
                async with httpx.AsyncClient() as client:
                    resp = await client.get(download_url)
                    if resp.status_code == 200:
                        file_bytes = resp.content
                        if type_message == "imageMessage": file_type = "image"
                        elif type_message == "audioMessage": file_type = "audio"
                        elif type_message == "documentMessage":
                            file_name = file_data.get("fileName", "").lower()
                            if file_name.endswith(".pdf"): file_type = "pdf"

        if message_text or file_bytes:
            file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8") if file_bytes else None
            process_agent_message_task.delay(chat_id, "telegram", message_text, file_bytes_b64, file_type)
            webhook_requests_total.labels(platform="telegram", status="queued").inc()
    
    webhook_latency_seconds.labels(platform="telegram").observe(time.time() - start)
    return {"status": "queued"}

@app.post("/webhook/green-api")
@limiter.limit("30/minute")
async def green_api_webhook(request: Request):
    start = time.time()
    body = await request.json()
    type_webhook = body.get("typeWebhook")
    
    chat_id = body.get("senderData", {}).get("chatId")
    if not chat_id:
        webhook_requests_total.labels(platform="green_api", status="ignored").inc()
        return {"status": "ignored"}

    message_text = None
    file_bytes = None
    file_type = None

    if type_webhook == "incomingMessageReceived":
        message_data = body.get("messageData", {})
        type_message = message_data.get("typeMessage")
        
        if type_message == "textMessage":
            message_text = message_data.get("textMessageData", {}).get("textMessage")
        elif type_message == "extendedTextMessage":
            message_text = message_data.get("extendedTextMessageData", {}).get("text")
        elif type_message in ["imageMessage", "audioMessage", "documentMessage"]:
            file_data = message_data.get(f"{type_message}Data", {})
            download_url = file_data.get("downloadUrl")
            caption = file_data.get("caption")
            if caption: message_text = caption

            if download_url:
                import httpx
                async with httpx.AsyncClient() as client:
                    resp = await client.get(download_url)
                    if resp.status_code == 200:
                        file_bytes = resp.content
                        if type_message == "imageMessage": file_type = "image"
                        elif type_message == "audioMessage": file_type = "audio"
                        elif type_message == "documentMessage":
                            file_name = file_data.get("fileName", "").lower()
                            if file_name.endswith(".pdf"): file_type = "pdf"

        if message_text or file_bytes:
            file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8") if file_bytes else None
            process_agent_message_task.delay(chat_id, "whatsapp", message_text, file_bytes_b64, file_type)
            webhook_requests_total.labels(platform="green_api", status="queued").inc()
    
    webhook_latency_seconds.labels(platform="green_api").observe(time.time() - start)
    return {"status": "queued"}

@app.post("/webhook/whatsapp")
@limiter.limit("30/minute")
async def whatsapp_web_webhook(request: Request):
    start = time.time()
    body = await request.json()
    
    chat_id = body.get("chatId")
    if not chat_id:
        webhook_requests_total.labels(platform="whatsapp_bridge", status="ignored").inc()
        return {"status": "ignored"}

    message_text = body.get("messageText")
    file_bytes = None
    file_type = body.get("fileType")
    
    raw_file = body.get("fileBytes")
    if raw_file:
        if isinstance(raw_file, str):
            file_bytes = raw_file  # Already base64 from bridge
        else:
            file_bytes = base64.b64encode(bytes(raw_file)).decode("utf-8")

    pushname = body.get("pushname")
    is_group = body.get("isGroup", False)

    if is_group:
        webhook_requests_total.labels(platform="whatsapp_bridge", status="ignored_group").inc()
        return {"status": "ignored_group"}

    if message_text or file_bytes:
        process_agent_message_task.delay(
            chat_id, "whatsapp", message_text, file_bytes, file_type, pushname
        )
        webhook_requests_total.labels(platform="whatsapp_bridge", status="queued").inc()
    
    webhook_latency_seconds.labels(platform="whatsapp_bridge").observe(time.time() - start)
    return {"status": "queued"}

@app.get("/health")
async def health_check():
    checks = {
        "server": "ok",
        "database": "unknown",
        "redis": "unknown",
        "whatsapp_bridge": "unknown",
    }
    status_code = 200

    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        status_code = 503

    try:
        import redis as redis_lib
        r = redis_lib.from_url(settings.REDIS_URL, socket_timeout=2)
        r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        status_code = 503

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.WHATSAPP_BRIDGE_URL}/health", timeout=5.0)
            if resp.status_code == 200:
                checks["whatsapp_bridge"] = "ok"
            else:
                checks["whatsapp_bridge"] = f"error: status {resp.status_code}"
                status_code = 503
    except Exception as e:
        checks["whatsapp_bridge"] = f"error: {str(e)}"
        status_code = 503

    return JSONResponse(content=checks, status_code=status_code)
