from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+psycopg://bagcoin:bagcoin123@postgres:5432/bagcoin"
    postgres_user: str = "bagcoin"
    postgres_password: str = "bagcoin123"
    postgres_db: str = "bagcoin"
    
    # LLM APIs
    groq_api_key: str = ""
    deepseek_api_key: str = ""
    opencode_api_key: str = ""
    tavily_api_key: str = ""
    default_llm_model: str = "llama-3.3-70b-versatile"
    
    # WhatsApp Bridge
    whatsapp_bridge_url: str = "http://whatsapp-bridge:3001"
    whatsapp_api_key: str = "bagcoin_webhook_secret_123"
    
    # Redis
    redis_url: str = "redis://redis:6379/0"
    
    # FastAPI
    fastapi_host: str = "0.0.0.0"
    fastapi_port: int = 8000
    
    # App
    environment: str = "development"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
