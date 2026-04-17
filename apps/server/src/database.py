from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from .config import settings

engine = create_engine(settings.DATABASE_URL)

def init_db():
    from . import models
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
