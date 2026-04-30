import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.models import User, Budget, Goal, Transaction, Category, GoalStatus
from app.agents.persistence import get_or_create_user

logger = logging.getLogger(__name__)


def get_db() -> Session:
    return SessionLocal()


# =====================================================================
# BUDGET
# =====================================================================

def create_budget(
    phone_number: str,
    name: str,
    total_limit: float,
    period: str = "monthly",
) -> Dict[str, Any]:
    """Cria um novo orçamento para o usuário, vinculado a uma categoria."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)

        category = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike(name)
        ).first()
        if not category:
            category = Category(
                user_id=user.id,
                name=name,
                is_default=False
            )
            db.add(category)
            db.commit()
            db.refresh(category)

        budget = Budget(
            user_id=user.id,
            category_id=category.id,
            name=name,
            period=period,
            total_limit=total_limit
        )
        db.add(budget)
        db.commit()
        db.refresh(budget)

        return {
            "id": budget.id,
            "name": budget.name,
            "category_id": category.id,
            "category_name": category.name,
            "total_limit": budget.total_limit,
            "period": budget.period,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar budget: {e}")
        raise
    finally:
        db.close()


def get_budgets(phone_number: str) -> List[Dict[str, Any]]:
    """Retorna orçamentos ativos do usuário com progresso."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()

        result = []
        for budget in budgets:
            spent = get_budget_spent(db, budget.id, user.id, budget.period)
            cat_name = budget.category.name if budget.category else budget.name
            result.append({
                "id": budget.id,
                "name": budget.name,
                "category_id": budget.category_id,
                "category_name": cat_name,
                "total_limit": budget.total_limit,
                "total_spent": spent,
                "total_remaining": budget.total_limit - spent,
                "percentage": round((spent / budget.total_limit) * 100, 1) if budget.total_limit > 0 else 0,
                "period": budget.period,
            })
        return result
    finally:
        db.close()


def get_budget_spent(db: Session, budget_id: int, user_id: int, period: str) -> float:
    """Calcula quanto já foi gasto no período do budget.
    
    Filtra pelo category_id do budget (obrigatório).
    """
    date_from = _period_start(period)
    if not date_from:
        return 0.0

    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user_id
    ).first()
    if not budget:
        return 0.0

    result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.type == "EXPENSE",
        Transaction.user_id == user_id,
        Transaction.category_id == budget.category_id,
        Transaction.transaction_date >= date_from
    ).scalar()
    return float(result or 0)


def get_category_spent(db: Session, user_id: int, category_id: int, period: str) -> float:
    """Calcula gastos de uma categoria no período."""
    date_from = _period_start(period)
    if not date_from:
        return 0.0

    result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.type == "EXPENSE",
        Transaction.user_id == user_id,
        Transaction.category_id == category_id,
        Transaction.transaction_date >= date_from
    ).scalar()
    return float(result or 0)


# =====================================================================
# GOAL
# =====================================================================

def create_goal(
    phone_number: str,
    title: str,
    target_amount: float,
    deadline: Optional[date] = None
) -> Dict[str, Any]:
    """Cria uma nova meta financeira."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)

        goal = Goal(
            user_id=user.id,
            title=title,
            target_amount=target_amount,
            current_amount=0.0,
            deadline=deadline,
            status=GoalStatus.ACTIVE
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)

        return {
            "id": goal.id,
            "title": goal.title,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "deadline": goal.deadline.isoformat() if goal.deadline else None,
            "percentage": 0.0
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar goal: {e}")
        raise
    finally:
        db.close()


def update_goal_progress(phone_number: str, goal_id: int, amount: float) -> Dict[str, Any]:
    """Atualiza o progresso de uma meta."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        goal = db.query(Goal).filter(
            Goal.id == goal_id,
            Goal.user_id == user.id
        ).first()

        if not goal:
            raise ValueError("Meta não encontrada")

        goal.current_amount = min(goal.current_amount + amount, goal.target_amount)
        if goal.current_amount >= goal.target_amount:
            goal.status = GoalStatus.COMPLETED

        db.commit()
        db.refresh(goal)

        return {
            "id": goal.id,
            "title": goal.title,
            "current_amount": goal.current_amount,
            "target_amount": goal.target_amount,
            "percentage": round((goal.current_amount / goal.target_amount) * 100, 1),
            "status": goal.status.value
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar goal: {e}")
        raise
    finally:
        db.close()


def get_goals(phone_number: str) -> List[Dict[str, Any]]:
    """Retorna metas ativas do usuário."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.ACTIVE
        ).all()

        return [
            {
                "id": g.id,
                "title": g.title,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "deadline": g.deadline.isoformat() if g.deadline else None,
                "percentage": round((g.current_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0,
                "status": g.status.value
            }
            for g in goals
        ]
    finally:
        db.close()


# =====================================================================
# ALERT PREFERENCES (escopo por usuário via phone → user_id)
# =====================================================================


def get_financial_alerts_enabled(phone_number: str) -> bool:
    """Alertas de orçamento/meta após transações e lembretes de prazo. Default: ativo."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        prefs = user.preferences or {}
        return bool(prefs.get("financial_alerts_enabled", True))
    finally:
        db.close()


def set_financial_alerts_enabled(phone_number: str, enabled: bool) -> None:
    """Persiste preferência de alertas no JSON do usuário."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        prefs = dict(user.preferences or {})
        prefs["financial_alerts_enabled"] = bool(enabled)
        user.preferences = prefs
        from sqlalchemy.orm.attributes import flag_modified

        flag_modified(user, "preferences")
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# =====================================================================
# ALERTS
# =====================================================================

def check_budget_alerts(phone_number: str) -> List[Dict[str, Any]]:
    """Verifica budgets que estão próximos ou acima do limite."""
    if not get_financial_alerts_enabled(phone_number):
        return []
    alerts = []
    budgets = get_budgets(phone_number)

    for budget in budgets:
        pct = budget["percentage"]
        if pct >= 100:
            alerts.append({
                "type": "budget_exceeded",
                "severity": "high",
                "budget_name": budget["name"],
                "message": f"⚠️ Alerta: você ultrapassou o orçamento '{budget['name']}' ({pct}% — R$ {budget['total_spent']:,.2f} de R$ {budget['total_limit']:,.2f})"
            })
        elif pct >= 80:
            alerts.append({
                "type": "budget_warning",
                "severity": "medium",
                "budget_name": budget["name"],
                "message": f"⚠️ Atenção: orçamento '{budget['name']}' está em {pct}% (R$ {budget['total_spent']:,.2f} de R$ {budget['total_limit']:,.2f})"
            })

    return alerts


def check_goal_alerts(phone_number: str) -> List[Dict[str, Any]]:
    """Verifica metas concluídas ou próximas do prazo."""
    if not get_financial_alerts_enabled(phone_number):
        return []
    alerts = []
    goals = get_goals(phone_number)
    today = date.today()

    for goal in goals:
        if goal["percentage"] >= 100:
            alerts.append({
                "type": "goal_completed",
                "severity": "info",
                "goal_title": goal["title"],
                "message": f"🎉 *Parabéns!* Meta '{goal['title']}' atingida! R$ {goal['current_amount']:,.2f} de R$ {goal['target_amount']:,.2f}"
            })
        elif goal.get("deadline"):
            deadline = date.fromisoformat(goal["deadline"])
            days_left = (deadline - today).days
            if days_left <= 7 and days_left > 0 and goal["percentage"] < 100:
                alerts.append({
                    "type": "goal_deadline",
                    "severity": "medium",
                    "goal_title": goal["title"],
                    "message": f"⏰ Meta '{goal['title']}' vence em {days_left} dias. Progresso: {goal['percentage']}% (R$ {goal['current_amount']:,.2f} de R$ {goal['target_amount']:,.2f})"
                })

    return alerts


def delete_all_budgets(phone_number: str) -> int:
    """Deleta todos os orçamentos do usuário. Retorna quantos foram deletados."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        count = db.query(Budget).filter(Budget.user_id == user.id).delete()
        db.commit()
        return count
    finally:
        db.close()


def delete_budget_by_name(phone_number: str, name: str) -> int:
    """Deleta orçamento pelo nome/categoria. Retorna quantos foram deletados."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        budgets = db.query(Budget).filter(
            Budget.user_id == user.id,
            Budget.name.ilike(f"%{name}%")
        ).all()
        if not budgets:
            budgets = db.query(Budget).filter(
                Budget.user_id == user.id
            ).join(Category, Budget.category_id == Category.id).filter(
                Category.name.ilike(f"%{name}%")
            ).all()
        count = 0
        for budget in budgets:
            db.delete(budget)
            count += 1
        db.commit()
        return count
    finally:
        db.close()


def update_budget_limit(phone_number: str, name: str, new_limit: float) -> Optional[Dict[str, Any]]:
    """Atualiza o limite de um orçamento pelo nome/categoria."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        budget = db.query(Budget).filter(
            Budget.user_id == user.id,
            Budget.name.ilike(f"%{name}%")
        ).first()
        if not budget:
            budget = db.query(Budget).filter(
                Budget.user_id == user.id
            ).join(Category, Budget.category_id == Category.id).filter(
                Category.name.ilike(f"%{name}%")
            ).first()
        if not budget:
            return None
        budget.total_limit = new_limit
        for item in budget.items:
            item.limit_amount = new_limit
        db.commit()
        db.refresh(budget)
        cat_name = budget.category.name if budget.category else budget.name
        return {
            "id": budget.id,
            "name": budget.name,
            "category_name": cat_name,
            "total_limit": budget.total_limit,
            "period": budget.period,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar budget: {e}")
        raise
    finally:
        db.close()


def delete_goal(phone_number: str, goal_identifier: str) -> bool:
    """Deleta uma meta pelo título ou índice. Retorna True se deletou."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.ACTIVE
        ).all()
        target = None
        for g in goals:
            if goal_identifier.lower() in g.title.lower():
                target = g
                break
        if not target:
            try:
                idx = int(goal_identifier) - 1
                if 0 <= idx < len(goals):
                    target = goals[idx]
            except ValueError:
                pass
        if not target:
            return False
        db.delete(target)
        db.commit()
        return True
    finally:
        db.close()


def update_goal(phone_number: str, goal_identifier: str, new_target: Optional[float] = None,
                new_title: Optional[str] = None, new_deadline: Optional[date] = None) -> Optional[Dict[str, Any]]:
    """Atualiza título, valor ou prazo de uma meta."""
    db = get_db()
    try:
        user = get_or_create_user(phone_number, db)
        goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.ACTIVE
        ).all()
        target = None
        for g in goals:
            if goal_identifier.lower() in g.title.lower():
                target = g
                break
        if not target:
            try:
                idx = int(goal_identifier) - 1
                if 0 <= idx < len(goals):
                    target = goals[idx]
            except ValueError:
                pass
        if not target:
            return None
        if new_target is not None:
            target.target_amount = new_target
        if new_title:
            target.title = new_title
        if new_deadline:
            target.deadline = new_deadline
        db.commit()
        db.refresh(target)
        return {
            "id": target.id,
            "title": target.title,
            "target_amount": target.target_amount,
            "current_amount": target.current_amount,
            "deadline": target.deadline.isoformat() if target.deadline else None,
            "percentage": round((target.current_amount / target.target_amount) * 100, 1) if target.target_amount > 0 else 0,
            "status": target.status.value,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar goal: {e}")
        raise
    finally:
        db.close()


def _period_start(period: str) -> Optional[datetime]:
    """Retorna a data de início do período."""
    today = date.today()
    if period == "daily":
        return datetime.combine(today, datetime.min.time())
    elif period == "weekly":
        week_ago = today - timedelta(days=today.weekday())
        return datetime.combine(week_ago, datetime.min.time())
    elif period == "monthly":
        return datetime.combine(today.replace(day=1), datetime.min.time())
    elif period == "yearly":
        return datetime.combine(today.replace(month=1, day=1), datetime.min.time())
    return None
