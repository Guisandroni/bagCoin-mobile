from typing import Optional, List
from sqlmodel import Session, select
from ..models.custom_category import CustomCategory


class CustomCategoryRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: int) -> List[CustomCategory]:
        statement = select(CustomCategory).where(CustomCategory.user_id == user_id)
        return self.session.exec(statement).all()

    def create(self, category: CustomCategory) -> CustomCategory:
        self.session.add(category)
        self.session.commit()
        self.session.refresh(category)
        return category

    def get_by_name(self, user_id: int, name: str) -> Optional[CustomCategory]:
        statement = select(CustomCategory).where(
            CustomCategory.user_id == user_id,
            CustomCategory.name.ilike(name)
        )
        return self.session.exec(statement).first()
