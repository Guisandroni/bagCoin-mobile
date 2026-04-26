import sys
sys.path.insert(0, "/app/src")

from sqlmodel import Session, select
from core.database import engine
from models.conversation_context import ConversationContext
from models.user import User

with Session(engine) as session:
    user = session.exec(select(User).where(User.whatsapp_number == "5511999999999@c.us")).first()
    if not user:
        print("User not found")
        sys.exit(0)
    ctx = session.exec(select(ConversationContext).where(ConversationContext.user_id == user.id)).first()
    if ctx:
        print(f"user_id={ctx.user_id}")
        print(f"awaiting_budget_month={ctx.awaiting_budget_month}")
        print(f"pending_budget_category={ctx.pending_budget_category}")
        print(f"pending_budget_amount={ctx.pending_budget_amount}")
        print(f"awaiting_fund_field={ctx.awaiting_fund_field}")
        print(f"last_intent={ctx.last_intent}")
        print(f"last_action={ctx.last_action}")
    else:
        print("No context found")
