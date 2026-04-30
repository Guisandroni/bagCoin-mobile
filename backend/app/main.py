import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import webhook

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação."""
    logger.info("🚀 Iniciando BagCoin API...")
    init_db()
    logger.info("✅ Banco de dados inicializado")
    yield
    logger.info("👋 Encerrando BagCoin API...")

app = FastAPI(
    title="BagCoin - Chatbot Financeiro Multi-Agent",
    description="API de orquestração multi-agent para chatbot financeiro via WhatsApp",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro não tratado: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )

# Inclui routers
app.include_router(webhook.router)

@app.get("/")
async def root():
    return {
        "name": "BagCoin API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "bagcoin-api"}


@app.get("/logs/{phone_number}")
async def get_agent_logs(phone_number: str, limit: int = 50):
    """Retorna os logs dos agentes para um determinado número de telefone."""
    try:
        from app.models.models import AgentLog, User
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.phone_number == phone_number).first()
            if not user:
                return {"error": "Usuário não encontrado"}
            logs = db.query(AgentLog).filter(
                AgentLog.user_id == user.id
            ).order_by(AgentLog.created_at.desc()).limit(limit).all()
            return {
                "phone_number": phone_number,
                "logs": [
                    {
                        "id": log.id,
                        "agent": log.agent_name,
                        "status": log.status,
                        "request": log.request_payload,
                        "response": log.response_payload,
                        "created_at": log.created_at.isoformat() if log.created_at else None
                    }
                    for log in logs
                ]
            }
        finally:
            db.close()
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    from app.config import get_settings
    
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.fastapi_host,
        port=settings.fastapi_port,
        reload=settings.environment == "development"
    )
