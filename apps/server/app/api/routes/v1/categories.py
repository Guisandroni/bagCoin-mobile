"""REST routes for BagCoin category CRUD.

Requires API Key authentication (same as webhook endpoints).
Phone number identifies the BagCoin user whose categories are being managed.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import verify_api_key as require_api_key
from app.agents.persistence import (
    create_category,
    delete_category,
    list_categories,
    rename_category,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[dict])
async def get_categories(
    phone_number: str = Query(..., description="BagCoin user phone number"),
    api_key: str = Depends(require_api_key),
):
    """List all categories for a BagCoin user."""
    try:
        cats = list_categories(phone_number)
        return cats
    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HTTPException(status_code=500, detail="Error listing categories")


@router.post("/", status_code=201)
async def add_category(
    phone_number: str = Query(..., description="BagCoin user phone number"),
    name: str = Query(..., description="Category name"),
    api_key: str = Depends(require_api_key),
):
    """Create a new category for a BagCoin user."""
    try:
        result = create_category(phone_number, name)
        if result is None:
            raise HTTPException(status_code=409, detail=f"Category '{name}' already exists")
        return {"message": f"Category '{name}' created", "category": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Error creating category")


@router.patch("/{old_name}")
async def update_category(
    old_name: str,
    phone_number: str = Query(..., description="BagCoin user phone number"),
    new_name: str = Query(..., description="New category name"),
    api_key: str = Depends(require_api_key),
):
    """Rename a category for a BagCoin user."""
    try:
        if rename_category(phone_number, old_name, new_name):
            return {"message": f"Category '{old_name}' renamed to '{new_name}'"}
        raise HTTPException(status_code=404, detail=f"Category '{old_name}' not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming category: {e}")
        raise HTTPException(status_code=500, detail="Error renaming category")


@router.delete("/{name}")
async def remove_category(
    name: str,
    phone_number: str = Query(..., description="BagCoin user phone number"),
    api_key: str = Depends(require_api_key),
):
    """Delete a category for a BagCoin user."""
    try:
        if delete_category(phone_number, name):
            return {"message": f"Category '{name}' deleted"}
        raise HTTPException(status_code=404, detail=f"Category '{name}' not found or is default")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail="Error deleting category")
