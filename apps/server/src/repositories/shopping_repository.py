from typing import Optional, List
from sqlmodel import Session, select
from ..models.shopping_list import ShoppingList
from ..models.shopping_item import ShoppingItem


class ShoppingRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_or_create_list(self, user_id: int) -> ShoppingList:
        statement = select(ShoppingList).where(ShoppingList.user_id == user_id)
        existing = self.session.exec(statement).first()
        if existing:
            return existing
        new_list = ShoppingList(user_id=user_id)
        self.session.add(new_list)
        self.session.commit()
        self.session.refresh(new_list)
        return new_list

    def add_item(self, item: ShoppingItem) -> ShoppingItem:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def get_items(self, list_id: int) -> List[ShoppingItem]:
        statement = select(ShoppingItem).where(
            ShoppingItem.shopping_list_id == list_id,
            ShoppingItem.is_checked == False
        )
        return self.session.exec(statement).all()

    def check_item(self, item_id: int) -> bool:
        item = self.session.get(ShoppingItem, item_id)
        if item:
            item.is_checked = True
            self.session.add(item)
            self.session.commit()
            return True
        return False
