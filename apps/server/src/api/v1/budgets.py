from typing import List, Optional, Annotated
from datetime import date
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...repositories.budget_repository import BudgetRepository
from ...models.budget import Budget
from ...models.budget_category import BudgetCategory
from ...core.logging import logger

router = APIRouter(prefix="/budgets", tags=["budgets"])


class BudgetCategoryCreate(BaseModel):
    category_name: str
    budgeted_amount: float


class BudgetCategoryResponse(BaseModel):
    id: int
    category_name: str
    budgeted_amount: float
    spent_amount: float


class BudgetCreate(BaseModel):
    year: int
    month: int
    total_budgeted: float
    categories: List[BudgetCategoryCreate]


class BudgetResponse(BaseModel):
    id: int
    year: int
    month: int
    total_budgeted: float
    categories: List[BudgetCategoryResponse]


class StatusResponse(BaseModel):
    status: str


@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    user: CurrentUserDep,
    db: DbSessionDep,
    year: Annotated[Optional[int], Query(None)] = None,
    month: Annotated[Optional[int], Query(None)] = None,
) -> List[BudgetResponse]:
    repo = BudgetRepository(db)
    # For simplicity, return all budgets for user
    # In production, you'd want a get_by_user method
    from sqlmodel import select
    statement = select(Budget).where(Budget.user_id == user.id)
    if year:
        statement = statement.where(Budget.year == year)
    if month:
        statement = statement.where(Budget.month == month)
    
    budgets = db.exec(statement).all()
    
    result = []
    for b in budgets:
        cats = db.exec(
            select(BudgetCategory).where(BudgetCategory.budget_id == b.id)
        ).all()
        result.append(BudgetResponse(
            id=b.id,
            year=b.year,
            month=b.month,
            total_budgeted=b.total_budgeted,
            categories=[
                BudgetCategoryResponse(
                    id=c.id,
                    category_name=c.category_name,
                    budgeted_amount=c.budgeted_amount,
                    spent_amount=c.spent_amount,
                )
                for c in cats
            ],
        ))
    
    return result


@router.post("", response_model=BudgetResponse)
def create_budget(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: BudgetCreate,
) -> BudgetResponse:
    repo = BudgetRepository(db)
    
    # Check if budget already exists for this period
    existing = repo.get_by_user_and_period(user.id, data.year, data.month)
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this period")
    
    budget = Budget(
        user_id=user.id,
        year=data.year,
        month=data.month,
        total_budgeted=data.total_budgeted,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    # Add categories
    categories = []
    for cat_data in data.categories:
        cat = BudgetCategory(
            budget_id=budget.id,
            category_name=cat_data.category_name,
            budgeted_amount=cat_data.budgeted_amount,
        )
        db.add(cat)
        categories.append(cat)
    
    db.commit()
    
    logger.info("budget_created", user_id=user.id, budget_id=budget.id)
    
    return BudgetResponse(
        id=budget.id,
        year=budget.year,
        month=budget.month,
        total_budgeted=budget.total_budgeted,
        categories=[
            BudgetCategoryResponse(
                id=c.id,
                category_name=c.category_name,
                budgeted_amount=c.budgeted_amount,
                spent_amount=c.spent_amount,
            )
            for c in categories
        ],
    )


@router.delete("/{budget_id}", response_model=StatusResponse)
def delete_budget(
    user: CurrentUserDep,
    db: DbSessionDep,
    budget_id: Annotated[int, ...],
) -> StatusResponse:
    from sqlmodel import select
    budget = db.exec(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Delete categories first
    cats = db.exec(select(BudgetCategory).where(BudgetCategory.budget_id == budget_id)).all()
    for cat in cats:
        db.delete(cat)
    
    db.delete(budget)
    db.commit()
    
    logger.info("budget_deleted", user_id=user.id, budget_id=budget_id)
    return StatusResponse(status="deleted")
