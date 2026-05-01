"""Persistence agent — sync database operations for BagCoin agents.

Uses sync_session_maker for compatibility with non-async agent code.
"""
import logging
from typing import Any
from datetime import datetime, timedelta

from sqlalchemy import func

from app.db.session import sync_session_maker
from app.db.models.phone_user import PhoneUser
from app.db.models.transaction import Transaction, TransactionType
from app.db.models.category import Category
from app.db.models.phone_conversation import PhoneConversation
from app.db.models.agent_log import AgentLog
from app.agents.tenant_context import assert_valid_tenant_phone

logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    "Alimentação", "Transporte", "Moradia", "Lazer",
    "Saúde", "Educação", "Outros",
]


def get_or_create_user_sync(phone_number: str) -> PhoneUser:
    """Get or create a phone user (sync)."""
    assert_valid_tenant_phone(phone_number)
    db = sync_session_maker()
    try:
        user = db.query(PhoneUser).filter(
            PhoneUser.phone_number == phone_number
        ).first()
        if not user:
            user = PhoneUser(
                phone_number=phone_number,
                preferences={"language": "pt-BR", "currency": "BRL"},
                financial_profile={},
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"New user created: {phone_number}")
        return user
    finally:
        db.close()


def get_or_create_user(phone_number: str, db=None) -> PhoneUser:
    """Get or create a phone user, optionally with an existing session."""
    if db:
        user = db.query(PhoneUser).filter(
            PhoneUser.phone_number == phone_number
        ).first()
        if not user:
            assert_valid_tenant_phone(phone_number)
            user = PhoneUser(
                phone_number=phone_number,
                preferences={"language": "pt-BR", "currency": "BRL"},
                financial_profile={},
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"New user created: {phone_number}")
        return user
    return get_or_create_user_sync(phone_number)


def save_transaction(state: dict[str, Any]) -> dict[str, Any]:
    """Persist extracted transaction to database."""
    db = sync_session_maker()
    try:
        phone_number = state.get("phone_number")
        extracted = state.get("extracted_data", {})

        if not extracted or extracted.get("amount") is None:
            state["error"] = "Não foi possível identificar o valor da transação."
            return state

        user = get_or_create_user(phone_number, db)
        state["user_id"] = user.id

        # Get or create category (case-insensitive)
        category_name = extracted.get("category", "Outros")
        category = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(category_name),
        ).first()

        if not category:
            # Normaliza o nome da categoria
            category_name = category_name.strip().capitalize()
            category = Category(
                user_id=user.id,
                name=category_name,
                is_default=(category_name in DEFAULT_CATEGORIES),
            )
            db.add(category)
            db.commit()
            db.refresh(category)

        # Parse date
        tx_date = datetime.utcnow()
        if extracted.get("date"):
            try:
                tx_date = datetime.strptime(extracted["date"], "%Y-%m-%d")
            except ValueError:
                try:
                    tx_date = datetime.strptime(extracted["date"], "%d/%m/%Y")
                except ValueError:
                    pass

        # Determine type
        tx_type = TransactionType.EXPENSE
        type_str = extracted.get("type", "EXPENSE").upper()
        if type_str == TransactionType.INCOME.value:
            tx_type = TransactionType.INCOME
        elif type_str == TransactionType.TRANSFER.value:
            tx_type = TransactionType.TRANSFER

        transaction = Transaction(
            user_id=user.id,
            type=tx_type.value,
            amount=extracted["amount"],
            currency=extracted.get("currency", "BRL"),
            category_id=category.id,
            description=extracted.get("description", ""),
            source_format=state.get("source_format", "text"),
            transaction_date=tx_date,
            confidence_score=extracted.get("confidence", 0.8),
            raw_input=extracted.get("raw_text", ""),
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        # Update conversation
        conv = db.query(PhoneConversation).filter(
            PhoneConversation.user_id == user.id,
        ).order_by(PhoneConversation.updated_at.desc()).first()

        if not conv:
            conv = PhoneConversation(user_id=user.id, channel="whatsapp")
            db.add(conv)

        conv.last_intent = state.get("intent", "unknown")
        from sqlalchemy.orm.attributes import flag_modified
        existing_context = dict(conv.context_json or {})
        existing_context.update({
            "last_transaction_id": transaction.id,
            "last_category": category_name,
            "last_amount": extracted["amount"],
        })
        conv.context_json = existing_context
        flag_modified(conv, "context_json")
        db.commit()

        # Agent log
        agent_log = AgentLog(
            user_id=user.id,
            agent_name="persistence",
            request_payload=extracted,
            response_payload={"transaction_id": transaction.id, "status": "saved"},
            status="success",
        )
        db.add(agent_log)
        db.commit()

        state["transaction_id"] = transaction.id
        state["category_name"] = category_name
        state["category_id"] = category.id
        logger.info(f"Transaction {transaction.id} saved for user {user.id}")

        # Update financial profile asynchronously
        try:
            update_financial_profile_sync(phone_number)
        except Exception:
            pass

    except Exception as e:
        db.rollback()
        logger.error(f"Error saving transaction: {e}")
        state["error"] = f"Erro ao salvar no banco: {str(e)}"
    finally:
        db.close()

    return state


def get_user_transactions(phone_number: str, limit: int = 50) -> list:
    """Return transactions for a user."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user.id,
        ).order_by(Transaction.transaction_date.desc()).limit(limit).all()
        return transactions
    finally:
        db.close()


def delete_transaction_by_id(phone_number: str, transaction_id: int) -> bool:
    """Delete a transaction by ID. Returns True if deleted."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
        ).first()
        if not tx:
            return False
        db.delete(tx)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting transaction: {e}")
        raise
    finally:
        db.close()


def update_transaction(
    phone_number: str,
    transaction_id: int,
    amount: float | None = None,
    description: str | None = None,
    category_name: str | None = None,
) -> dict | None:
    """Update transaction fields. Returns dict with updated data or None."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
        ).first()
        if not tx:
            return None
        if amount is not None:
            tx.amount = amount
        if description is not None:
            tx.description = description
        if category_name is not None:
            category = db.query(Category).filter(
                Category.user_id == user.id,
                Category.name == category_name,
            ).first()
            if not category:
                category = Category(
                    user_id=user.id,
                    name=category_name,
                    is_default=(category_name in DEFAULT_CATEGORIES),
                )
                db.add(category)
                db.commit()
                db.refresh(category)
            tx.category_id = category.id
        db.commit()
        db.refresh(tx)
        return {
            "id": tx.id,
            "amount": tx.amount,
            "description": tx.description,
            "category": category_name or (
                db.query(Category).get(tx.category_id).name if tx.category_id else None
            ),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating transaction: {e}")
        raise
    finally:
        db.close()


def save_message_to_history(phone_number: str, role: str, content: str):
    """Save message to conversation history."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(PhoneConversation).filter(
            PhoneConversation.user_id == user.id,
        ).order_by(PhoneConversation.updated_at.desc()).first()
        if not conv:
            conv = PhoneConversation(user_id=user.id, channel="whatsapp")
            db.add(conv)
            db.commit()
            db.refresh(conv)
        from sqlalchemy.orm.attributes import flag_modified
        history = list(conv.message_history or [])
        history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        })
        history = history[-50:]
        conv.message_history = history
        flag_modified(conv, "message_history")
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving message history: {e}")
    finally:
        db.close()


def get_conversation_history(phone_number: str, limit: int = 10) -> str:
    """Return last N conversation messages formatted as text."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(PhoneConversation).filter(
            PhoneConversation.user_id == user.id,
        ).order_by(PhoneConversation.updated_at.desc()).first()

        if not conv or not conv.message_history:
            return ""

        history = list(conv.message_history or [])
        recent = history[-limit:]

        lines = []
        for msg in recent:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            label = "Usuário" if role == "user" else "BagCoin"
            lines.append(f"{label}: {content[:200]}")

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error retrieving history: {e}")
        return ""
    finally:
        db.close()


def save_user_name(phone_number: str, name: str):
    """Save user name."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        user.name = name
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving user name: {e}")
    finally:
        db.close()


def create_category(phone_number: str, name: str) -> dict | None:
    """Create a new category for the user."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        existing = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(name),
        ).first()
        if existing:
            return None
        cat = Category(user_id=user.id, name=name, is_default=False)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return {"id": cat.id, "name": cat.name}
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating category: {e}")
        raise
    finally:
        db.close()


def delete_category(phone_number: str, name: str) -> bool:
    """Remove a category from the user."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        cat = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(name),
        ).first()
        if not cat or cat.is_default:
            return False
        db.delete(cat)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting category: {e}")
        raise
    finally:
        db.close()


def rename_category(phone_number: str, old_name: str, new_name: str) -> bool:
    """Rename a category."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        cat = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(old_name),
        ).first()
        if not cat:
            return False
        cat.name = new_name
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error renaming category: {e}")
        raise
    finally:
        db.close()


def list_categories(phone_number: str) -> list[dict]:
    """List all categories for the user."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        cats = db.query(Category).filter(Category.user_id == user.id).all()
        return [
            {"id": c.id, "name": c.name, "is_default": c.is_default}
            for c in sorted(cats, key=lambda x: (not x.is_default, x.name))
        ]
    finally:
        db.close()


def update_financial_profile_sync(phone_number: str) -> dict:
    """Update user's financial profile based on transaction history."""
    db = sync_session_maker()
    try:
        user = get_or_create_user(phone_number, db)
        user_id = user.id

        ninety_days_ago = datetime.utcnow() - timedelta(days=90)

        # Total by category
        cat_totals = db.query(
            Category.name,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
            func.count(Transaction.id).label("count"),
        ).join(Category, Transaction.category_id == Category.id).filter(
            Transaction.user_id == user_id,
            Transaction.type == "EXPENSE",
            Transaction.transaction_date >= ninety_days_ago,
        ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).all()

        # Totals
        totals = db.query(
            func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == "INCOME"), 0).label("income"),
            func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == "EXPENSE"), 0).label("expense"),
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= ninety_days_ago,
        ).first()

        total_income = float(totals.income) if totals else 0
        total_expense = float(totals.expense) if totals else 0

        profile = {
            "top_categories": [
                {"name": cat.name, "total": float(cat.total), "count": cat.count}
                for cat in cat_totals[:5]
            ],
            "total_income_90d": total_income,
            "total_expense_90d": total_expense,
            "savings_rate": round((total_income - total_expense) / total_income * 100, 1) if total_income > 0 else 0,
            "average_monthly_spending": round(total_expense / 3, 2),
            "transaction_count_90d": sum(cat.count for cat in cat_totals),
            "last_updated": datetime.utcnow().isoformat(),
        }

        from sqlalchemy.orm.attributes import flag_modified
        user.financial_profile = profile
        flag_modified(user, "financial_profile")
        db.commit()

        logger.info(f"Financial profile updated for {phone_number}: {len(cat_totals)} categories")
        return profile

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating financial profile: {e}")
        return {}
    finally:
        db.close()
