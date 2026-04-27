from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from ...core.dependencies import CurrentUserDep, DbSessionDep
from ...models.custom_category import CustomCategory
from ...core.logging import logger
from sqlmodel import select

# Fixed categories from the agent
FIXED_CATEGORIES = [
    "Alimentação", "Restaurante", "Delivery", "Transporte", "Moradia",
    "Luz", "Água", "Internet", "Telefone", "Saúde", "Educação",
    "Lazer", "Viagem", "Vestuário", "Beleza", "Tecnologia",
    "Assinaturas", "Pet", "Doação", "Impostos", "Receita", "Outros"
]

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryResponse(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_custom: bool = False


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    category_type: str = "expense"


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    user: CurrentUserDep,
    db: DbSessionDep,
):
    # Get fixed categories
    categories = [
        CategoryResponse(name=cat, is_custom=False)
        for cat in FIXED_CATEGORIES
    ]
    
    # Get custom categories for user
    custom_cats = db.exec(
        select(CustomCategory).where(CustomCategory.user_id == user.id)
    ).all()
    
    categories.extend([
        CategoryResponse(
            name=c.name,
            icon=c.icon,
            color=c.color,
            is_custom=True,
        )
        for c in custom_cats
    ])
    
    return categories


@router.post("", response_model=CategoryResponse)
def create_category(
    user: CurrentUserDep,
    db: DbSessionDep,
    data: CategoryCreate,
):
    # Check if category already exists
    if data.name in FIXED_CATEGORIES:
        return CategoryResponse(name=data.name, is_custom=False)
    
    existing = db.exec(
        select(CustomCategory).where(
            CustomCategory.user_id == user.id,
            CustomCategory.name == data.name,
        )
    ).first()
    
    if existing:
        return CategoryResponse(
            name=existing.name,
            icon=existing.icon,
            color=existing.color,
            is_custom=True,
        )
    
    cat = CustomCategory(
        user_id=user.id,
        name=data.name,
        icon=data.icon,
        color=data.color,
        category_type=data.category_type,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    
    logger.info("custom_category_created", user_id=user.id, category_name=cat.name)
    
    return CategoryResponse(
        name=cat.name,
        icon=cat.icon,
        color=cat.color,
        is_custom=True,
    )
