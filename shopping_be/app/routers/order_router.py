from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel

from app.services.order_service import OrderService
from app.schemas.order import OrderResponse, CreateOrderRequest
from app.schemas.upload import UpdateOrderStatusRequest
from app.schemas.common import ApiResponse
from app.deps import get_order_service, get_current_user, require_user, require_admin

router = APIRouter(prefix="/orders", tags=["orders"])

class PaginatedOrderResponse(BaseModel):
    items: list[OrderResponse]

@router.post("", response_model=ApiResponse)
def create_order(
    request: Request,
    body: CreateOrderRequest,
    order_service: OrderService = Depends(get_order_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    order = order_service.create_order(username, body)
    return ApiResponse.success_response("Order created successfully", order)


@router.get("/my", response_model=ApiResponse)
def get_my_orders(
    request: Request,
    page: int = 0,
    size: int = 10,
    order_service: OrderService = Depends(get_order_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    orders = order_service.get_my_orders(username, page, size)
    return ApiResponse.success_response(data=orders)


@router.get("/{id}", response_model=ApiResponse)
def get_order(
    id: int,
    request: Request,
    order_service: OrderService = Depends(get_order_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    order = order_service.get_order(id, username, current_user.get("role"))
    return ApiResponse.success_response(data=order)


@router.get("", response_model=ApiResponse)
def get_all_orders(
    request: Request,
    page: int = 0,
    size: int = 10,
    order_service: OrderService = Depends(get_order_service),
    admin: dict = Depends(require_admin)
) -> Any:
    orders = order_service.get_all_orders(page, size)
    return ApiResponse.success_response(data=orders)


@router.put("/{id}/status", response_model=ApiResponse)
def update_order_status(
    id: int,
    request: UpdateOrderStatusRequest,
    order_service: OrderService = Depends(get_order_service),
    admin: dict = Depends(require_admin)
) -> Any:
    order = order_service.update_order_status(id, request)
    return ApiResponse.success_response("Order status updated", order)


@router.delete("/{id}", response_model=ApiResponse)
def delete_order(
    id: int,
    order_service: OrderService = Depends(get_order_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    user_role = current_user.get("role", "")
    order_service.delete_order(id, username, user_role)
    return ApiResponse.success_response("Order deleted successfully")
