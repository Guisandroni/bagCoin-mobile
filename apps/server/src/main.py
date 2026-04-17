from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from whatsapp_api_client_python import API
from langchain_core.messages import HumanMessage
from .config import settings
from .database import init_db, engine
from .agents.graph import graph
from .models import User
from sqlmodel import Session, select
import os
from datetime import datetime

app = FastAPI(title="Agent Financeiro Multi-Platform (Green API)")

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
    print(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

green_api = API.GreenAPI(
    settings.GREEN_API_ID_INSTANCE, 
    settings.GREEN_API_TOKEN_INSTANCE
)

telegram_api = None
if settings.TELEGRAM_ID_INSTANCE and settings.TELEGRAM_TOKEN_INSTANCE:
    telegram_api = API.GreenAPI(
        settings.TELEGRAM_ID_INSTANCE,
        settings.TELEGRAM_TOKEN_INSTANCE
    )

@app.on_event("startup")
def on_startup():
    init_db()

async def process_agent_message(chat_id: str, platform: str, message_text: str = None, file_bytes: bytes = None, file_type: str = None):
    print(f"Processing {platform} {file_type or 'text'} message for {chat_id}")
    config = {"configurable": {"thread_id": f"{platform}:{chat_id}"}}
    
    content = message_text or f"[Anexo {file_type}]"
    
    initial_state = {
        "messages": [HumanMessage(content=content)],
        "whatsapp_number": chat_id,
        "file_bytes": file_bytes,
        "file_type": file_type
    }
    
    try:
        final_state = graph.invoke(initial_state, config=config)
        
        pdf_bytes = final_state.get("report_pdf_bytes")
        api_client = green_api if platform == "whatsapp" else telegram_api

        if pdf_bytes:
            filename = f"Relatorio_{datetime.now().strftime('%Y%m%d')}.pdf"
            with open(filename, "wb") as f:
                f.write(pdf_bytes)
            if api_client:
                api_client.sending.sendFileByUpload(chat_id, filename, filename, "Aqui está seu relatório financeiro.")
            os.remove(filename)
        else:
            response_text = final_state["messages"][-1].content
            if api_client:
                api_client.sending.sendMessage(chat_id, response_text)
        
    except Exception as e:
        print(f"Error processing agent: {e}")
        import traceback
        traceback.print_exc()
        api_client = green_api if platform == "whatsapp" else telegram_api
        if api_client:
            api_client.sending.sendMessage(chat_id, "Desculpe, tive um problema ao processar seu pedido.")

import secrets
import string

def generate_random_token(length=8):
    prefix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(3))
    suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
    return f"{prefix}-{suffix}"

@app.post("/users/pre-register/")
@app.post("/users/pre-register")
async def pre_register_user(data: dict = None):
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
        except Exception as e:
            session.rollback()
            token = generate_random_token()
            new_user.activation_token = token
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
        
    return {"status": "success", "token": token, "id": new_user.id}

@app.post("/webhook/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    if not telegram_api:
        return {"status": "telegram_not_configured"}

    body = await request.json()
    type_webhook = body.get("typeWebhook")
    
    chat_id = body.get("senderData", {}).get("chatId")
    if not chat_id:
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
            background_tasks.add_task(process_agent_message, chat_id, "telegram", message_text, file_bytes, file_type)
            
    return {"status": "success"}

@app.post("/webhook/green-api")
async def green_api_webhook(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    type_webhook = body.get("typeWebhook")
    
    chat_id = body.get("senderData", {}).get("chatId")
    if not chat_id:
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
            background_tasks.add_task(process_agent_message, chat_id, "whatsapp", message_text, file_bytes, file_type)
            
    return {"status": "success"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
