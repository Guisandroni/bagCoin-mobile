from typing import Optional
from sqlmodel import Session, select
from ..models.conversation_context import ConversationContext


class ConversationContextRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user(self, user_id: int) -> Optional[ConversationContext]:
        statement = select(ConversationContext).where(ConversationContext.user_id == user_id)
        return self.session.exec(statement).first()

    def get_or_create(self, user_id: int) -> ConversationContext:
        ctx = self.get_by_user(user_id)
        if ctx is None:
            ctx = ConversationContext(user_id=user_id)
            self.session.add(ctx)
            self.session.commit()
            self.session.refresh(ctx)
        return ctx

    def update(self, ctx: ConversationContext) -> ConversationContext:
        from datetime import datetime
        ctx.updated_at = datetime.utcnow()
        self.session.add(ctx)
        self.session.commit()
        self.session.refresh(ctx)
        return ctx

    def clear_context(self, user_id: int) -> None:
        ctx = self.get_by_user(user_id)
        if ctx:
            ctx.awaiting_budget_month = False
            ctx.pending_budget_category = None
            ctx.pending_budget_amount = None
            ctx.awaiting_fund_field = None
            ctx.pending_fund = None
            ctx.last_intent = None
            ctx.last_action = None
            ctx.awaiting_file_type = False
            ctx.pending_file_bytes = None
            ctx.pending_file_type = None
            self.session.add(ctx)
            self.session.commit()
