from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.exceptions import DuplicateResourceException, ResourceNotFoundException
from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/categories", tags=["categories"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=ApiResponse)
def list_categories(db: Session = Depends(get_db)) -> Any:
    """Return all active categories (public)."""
    repo = CategoryRepository(db)
    categories = repo.get_all()
    data = [
        CategoryResponse.model_validate(c).model_dump()
        for c in categories
    ]
    return ApiResponse.success_response(data=data)


@router.post("", response_model=ApiResponse)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Create a new category (admin only)."""
    repo = CategoryRepository(db)
    if repo.get_by_name(body.name):
        raise DuplicateResourceException(f"Category with name '{body.name}' already exists")
    category = repo.create(Category(name=body.name, description=body.description))
    return ApiResponse.success_response(
        "Category created successfully",
        CategoryResponse.model_validate(category).model_dump(),
    )


@router.put("/{id}", response_model=ApiResponse)
def update_category(
    id: int,
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Update a category (admin only)."""
    repo = CategoryRepository(db)
    category = repo.get_by_id(id)
    if not category:
        raise ResourceNotFoundException(f"Category with id {id} not found")
    # Check name uniqueness (excluding current record)
    existing = repo.get_by_name(body.name)
    if existing and existing.id != id:
        raise DuplicateResourceException(f"Category with name '{body.name}' already exists")
    category.name = body.name
    category.description = body.description
    category = repo.update(category)
    return ApiResponse.success_response(
        "Category updated successfully",
        CategoryResponse.model_validate(category).model_dump(),
    )


@router.delete("/{id}", response_model=ApiResponse)
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Soft-delete a category (admin only)."""
    repo = CategoryRepository(db)
    category = repo.get_by_id(id)
    if not category:
        raise ResourceNotFoundException(f"Category with id {id} not found")
    category.is_deleted = True
    repo.update(category)
    return ApiResponse.success_response("Category deleted successfully")
