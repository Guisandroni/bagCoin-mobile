import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import User, Transaction, Category, Budget, BudgetItem, Goal, Conversation, AgentLog
from app.models.models import TransactionType
from app.agents.tenant_context import assert_valid_tenant_phone

logger = logging.getLogger(__name__)

def get_or_create_user(phone_number: str, db: Session = None) -> User:
    """Busca ou cria usuário pelo número de telefone."""
    assert_valid_tenant_phone(phone_number)
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    
    try:
        user = db.query(User).filter(User.phone_number == phone_number).first()
        if not user:
            user = User(
                phone_number=phone_number,
                preferences={"language": "pt-BR", "currency": "BRL"},
                financial_profile={}
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Novo usuário criado: {phone_number}")
        return user
    finally:
        if should_close:
            db.close()

def save_transaction(state: Dict[str, Any]) -> Dict[str, Any]:
    """Persiste transação extraída no banco de dados."""
    db = SessionLocal()
    try:
        phone_number = state.get("phone_number")
        extracted = state.get("extracted_data", {})
        
        if not extracted or extracted.get("amount") is None:
            state["error"] = "Não foi possível identificar o valor da transação."
            return state
        
        user = get_or_create_user(phone_number, db)
        state["user_id"] = user.id
        
        # Busca ou cria categoria
        category_name = extracted.get("category", "Outros")
        category = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name == category_name
        ).first()
        
        if not category:
            category = Category(
                user_id=user.id,
                name=category_name,
                is_default=(category_name in ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"])
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
        
        # Determina tipo
        tx_type = TransactionType.EXPENSE
        type_str = extracted.get("type", "EXPENSE")
        if type_str == "INCOME":
            tx_type = TransactionType.INCOME
        elif type_str == "TRANSFER":
            tx_type = TransactionType.TRANSFER
        
        transaction = Transaction(
            user_id=user.id,
            type=tx_type,
            amount=extracted["amount"],
            currency=extracted.get("currency", "BRL"),
            category_id=category.id,
            description=extracted.get("description", ""),
            source_format=state.get("source_format", "text"),
            transaction_date=tx_date,
            confidence_score=extracted.get("confidence", 0.8),
            raw_input=extracted.get("raw_text", "")
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Atualiza conversa
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        
        if not conversation:
            conversation = Conversation(user_id=user.id, channel="whatsapp")
            db.add(conversation)
        
        conversation.last_intent = state.get("intent", "unknown")
        # Preserva wizard state e outros dados existentes no context_json
        from sqlalchemy.orm.attributes import flag_modified
        existing_context = dict(conversation.context_json or {})
        existing_context.update({
            "last_transaction_id": transaction.id,
            "last_category": category_name,
            "last_amount": extracted["amount"]
        })
        conversation.context_json = existing_context
        flag_modified(conversation, "context_json")
        db.commit()
        
        # Log do agente
        agent_log = AgentLog(
            user_id=user.id,
            agent_name="persistence",
            request_payload=extracted,
            response_payload={"transaction_id": transaction.id, "status": "saved"},
            status="success"
        )
        db.add(agent_log)
        db.commit()
        
        state["transaction_id"] = transaction.id
        state["category_name"] = category_name
        state["category_id"] = category.id
        logger.info(f"Transação {transaction.id} salva para usuário {user.id}")

        # Atualiza perfil financeiro assincronamente (após transação)
        try:
            update_financial_profile(phone_number)
        except Exception:
            pass
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao salvar transação: {e}")
        state["error"] = f"Erro ao salvar no banco: {str(e)}"
    finally:
        db.close()
    
    return state

def get_user_transactions(phone_number: str, limit: int = 50) -> list:
    """Retorna transações do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        transactions = db.query(Transaction).filter(
            Transaction.user_id == user.id
        ).order_by(Transaction.transaction_date.desc()).limit(limit).all()
        return transactions
    finally:
        db.close()


def delete_transaction_by_id(phone_number: str, transaction_id: int) -> bool:
    """Deleta uma transação do usuário pelo ID. Retorna True se deletou."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id
        ).first()
        if not tx:
            return False
        db.delete(tx)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar transação: {e}")
        raise
    finally:
        db.close()


def update_transaction(phone_number: str, transaction_id: int,
                       amount: float = None, description: str = None,
                       category_name: str = None) -> Optional[dict]:
    """Atualiza campos de uma transação. Retorna dict com dados atualizados ou None."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        tx = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id
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
                Category.name == category_name
            ).first()
            if not category:
                category = Category(
                    user_id=user.id,
                    name=category_name,
                    is_default=(category_name in ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Outros"])
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
            "category": category_name or (db.query(Category).get(tx.category_id).name if tx.category_id else None),
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar transação: {e}")
        raise
    finally:
        db.close()


def save_message_to_history(phone_number: str, role: str, content: str):
    """Salva mensagem no histórico da conversa."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        if not conv:
            conv = Conversation(user_id=user.id, channel="whatsapp")
            db.add(conv)
            db.commit()
            db.refresh(conv)
        from sqlalchemy.orm.attributes import flag_modified
        history = list(conv.message_history or [])
        history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        history = history[-50:]
        conv.message_history = history
        flag_modified(conv, "message_history")
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao salvar histórico de mensagem: {e}")
    finally:
        db.close()


def get_conversation_history(phone_number: str, limit: int = 10) -> str:
    """Retorna as últimas N mensagens da conversa formatadas como texto.
    
    Args:
        phone_number: Número do usuário
        limit: Máximo de mensagens a retornar
        
    Returns:
        String formatada com o histórico, ou string vazia se não houver
    """
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        conv = db.query(Conversation).filter(
            Conversation.user_id == user.id
        ).order_by(Conversation.updated_at.desc()).first()
        
        if not conv or not conv.message_history:
            return ""
        
        history = list(conv.message_history or [])
        # Pega as últimas N mensagens
        recent = history[-limit:]
        
        lines = []
        for msg in recent:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            label = "Usuário" if role == "user" else "BagCoin"
            lines.append(f"{label}: {content[:200]}")
        
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Erro ao recuperar histórico: {e}")
        return ""
    finally:
        db.close()


def save_user_name(phone_number: str, name: str):
    """Salva o nome do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        user.name = name
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao salvar nome do usuário: {e}")
    finally:
        db.close()


# =====================================================================
# CRUD de Categorias
# =====================================================================

def create_category(phone_number: str, name: str) -> dict | None:
    """Cria uma nova categoria para o usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        existing = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(name)
        ).first()
        if existing:
            return None  # já existe
        cat = Category(user_id=user.id, name=name, is_default=False)
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return {"id": cat.id, "name": cat.name}
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar categoria: {e}")
        raise
    finally:
        db.close()


def delete_category(phone_number: str, name: str) -> bool:
    """Remove uma categoria do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        cat = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(name)
        ).first()
        if not cat or cat.is_default:
            return False
        db.delete(cat)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar categoria: {e}")
        raise
    finally:
        db.close()


def rename_category(phone_number: str, old_name: str, new_name: str) -> bool:
    """Renomeia uma categoria do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        cat = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(old_name)
        ).first()
        if not cat:
            return False
        cat.name = new_name
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao renomear categoria: {e}")
        raise
    finally:
        db.close()


def list_categories(phone_number: str) -> list[dict]:
    """Lista todas as categorias do usuário."""
    db = SessionLocal()
    try:
        user = get_or_create_user(phone_number, db)
        cats = db.query(Category).filter(Category.user_id == user.id).all()
        return [
            {"id": c.id, "name": c.name, "is_default": c.is_default}
            for c in sorted(cats, key=lambda x: (not x.is_default, x.name))
        ]
    finally:
        db.close()


def update_financial_profile(phone_number: str) -> dict:
    """Atualiza o perfil financeiro do usuário baseado no histórico de transações.
    
    Calcula:
    - Categorias mais frequentes
    - Gasto médio mensal
    - Taxa de poupança (receitas - despesas) / receitas
    - Dia/horário mais comum de registrar gastos
    """
    db = SessionLocal()
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        user = get_or_create_user(phone_number, db)
        user_id = user.id
        
        # Últimos 90 dias para análise
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        # Gasto total por categoria
        cat_totals = db.query(
            Category.name,
            func.coalesce(func.sum(Transaction.amount), 0).label('total'),
            func.count(Transaction.id).label('count')
        ).join(Category, Transaction.category_id == Category.id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'EXPENSE',
            Transaction.transaction_date >= ninety_days_ago
        ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).all()
        
        # Totais de receitas e despesas no período
        totals = db.query(
            func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == 'INCOME'), 0).label('income'),
            func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == 'EXPENSE'), 0).label('expense'),
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= ninety_days_ago
        ).first()
        
        total_income = float(totals.income) if totals else 0
        total_expense = float(totals.expense) if totals else 0
        
        # Monta perfil
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
        
        logger.info(f"Perfil financeiro atualizado para {phone_number}: {len(cat_totals)} categorias")
        return profile
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar perfil financeiro: {e}")
        return {}
    finally:
        db.close()
