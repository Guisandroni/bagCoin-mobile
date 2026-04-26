from typing import Optional, List
from sqlmodel import Session, select
from ..models.fund import Fund
from ..models.fund_contribution import FundContribution


class FundRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: int) -> List[Fund]:
        statement = select(Fund).where(Fund.user_id == user_id)
        return self.session.exec(statement).all()

    def get_by_id(self, fund_id: int, user_id: int) -> Optional[Fund]:
        statement = select(Fund).where(Fund.id == fund_id, Fund.user_id == user_id)
        return self.session.exec(statement).first()

    def create(self, fund: Fund) -> Fund:
        self.session.add(fund)
        self.session.commit()
        self.session.refresh(fund)
        return fund

    def add_contribution(self, contribution: FundContribution) -> FundContribution:
        self.session.add(contribution)
        self.session.commit()
        self.session.refresh(contribution)
        # Update fund current_amount
        fund = self.session.get(Fund, contribution.fund_id)
        if fund:
            fund.current_amount += contribution.amount
            self.session.add(fund)
            self.session.commit()
        return contribution
