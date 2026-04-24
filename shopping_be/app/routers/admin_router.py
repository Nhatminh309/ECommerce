from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.enums import OrderStatus
from app.exceptions import ResourceNotFoundException
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=ApiResponse)
def dashboard(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Return key store statistics for the admin dashboard."""

    # Total revenue — sum of total_price for non-PENDING orders
    revenue_stmt = select(func.sum(Order.total_price)).where(
        Order.status != OrderStatus.PENDING
    )
    total_revenue = db.execute(revenue_stmt).scalar() or 0

    # Total orders
    order_count_stmt = select(func.count(Order.id))
    total_orders = db.execute(order_count_stmt).scalar() or 0

    # Total active users
    user_count_stmt = select(func.count(User.id)).where(User.is_deleted == False)
    total_users = db.execute(user_count_stmt).scalar() or 0

    # Total active products
    product_count_stmt = select(func.count(Product.id)).where(Product.is_deleted == False)
    total_products = db.execute(product_count_stmt).scalar() or 0

    # Orders grouped by status
    status_stmt = select(Order.status, func.count(Order.id)).group_by(Order.status)
    status_rows = db.execute(status_stmt).all()
    orders_by_status = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in status_rows
    }

    # 5 most recent orders with user info
    recent_stmt = (
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders_raw = db.execute(recent_stmt).scalars().all()
    recent_orders = [
        {
            "id": o.id,
            "user_id": o.user_id,
            "username": o.user.username if o.user else None,
            "total_price": float(o.total_price),
            "status": o.status.value if hasattr(o.status, "value") else str(o.status),
            "created_at": str(o.created_at),
        }
        for o in recent_orders_raw
    ]

    stats = {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "total_users": total_users,
        "total_products": total_products,
        "orders_by_status": orders_by_status,
        "recent_orders": recent_orders,
    }
    return ApiResponse.success_response(data=stats)


# ── User management ───────────────────────────────────────────────────────────

@router.get("/users", response_model=ApiResponse)
def list_users(
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Return a paginated list of all users (admin only)."""
    repo = UserRepository(db)
    skip = page * size
    users = repo.find_all_paginated(skip=skip, limit=size)
    total = repo.count_all()
    data = {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "role": u.role,
                "is_deleted": u.is_deleted,
                "created_at": str(u.created_at),
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "size": size,
    }
    return ApiResponse.success_response(data=data)


@router.put("/users/{id}/toggle-active", response_model=ApiResponse)
def toggle_user_active(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Toggle the is_deleted flag for a user (admin only)."""
    repo = UserRepository(db)
    user = repo.get_by_id(id)
    if not user:
        raise ResourceNotFoundException(f"User with id {id} not found")
    user.is_deleted = not user.is_deleted
    user = repo.update(user)
    status_label = "deactivated" if user.is_deleted else "activated"
    data = {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_deleted": user.is_deleted,
        "created_at": str(user.created_at),
    }
    return ApiResponse.success_response(f"User {status_label} successfully", data)
