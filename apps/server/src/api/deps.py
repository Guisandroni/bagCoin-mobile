from typing import Annotated
from fastapi import Depends
from sqlmodel import Session
from ..core.database import get_db

DbSessionDep = Annotated[Session, Depends(get_db)]
