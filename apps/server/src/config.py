from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str
    TAVILY_API_KEY: Optional[str] = None
    
    GREEN_API_ID_INSTANCE: Optional[str] = None
    GREEN_API_TOKEN_INSTANCE: Optional[str] = None

    TELEGRAM_ID_INSTANCE: Optional[str] = None
    TELEGRAM_TOKEN_INSTANCE: Optional[str] = None

    WHATSAPP_BRIDGE_URL: str = "http://localhost:3002"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    DATABASE_URL: str
    SECRET_KEY: str = "secret"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

Settings.model_rebuild()

settings = Settings()
