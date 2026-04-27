from typing import Optional, List
from sqlmodel import Session, select
from ..models.budget import Budget
from ..models.budget_category import BudgetCategory


class BudgetRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user_and_period(self, user_id: int, year: int, month: int) -> Optional[Budget]:
        statement = select(Budget).where(
            Budget.user_id == user_id,
            Budget.year == year,
            Budget.month == month
        )
        return self.session.exec(statement).first()

    def create(self, budget: Budget) -> Budget:
        self.session.add(budget)
        self.session.commit()
        self.session.refresh(budget)
        return budget

    def get_or_create(self, user_id: int, year: int, month: int) -> Budget:
        budget = self.get_by_user_and_period(user_id, year, month)
        if not budget:
            budget = Budget(user_id=user_id, year=year, month=month)
            self.create(budget)
        return budget

    def add_category(self, budget_category: BudgetCategory) -> BudgetCategory:
        self.session.add(budget_category)
        self.session.commit()
        self.session.refresh(budget_category)
        return budget_category

    def get_category(self, budget_id: int, category_name: str) -> Optional[BudgetCategory]:
        statement = select(BudgetCategory).where(
            BudgetCategory.budget_id == budget_id,
            BudgetCategory.category_name == category_name
        )
        return self.session.exec(statement).first()

    def update_spent(self, budget_id: int, category_name: str, amount: float):
        bc = self.get_category(budget_id, category_name)
        if bc:
            bc.spent_amount += amount
            self.session.add(bc)
            self.session.commit()
