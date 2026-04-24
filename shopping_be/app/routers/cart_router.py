from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Any

from app.services.cart_service import CartService
from app.schemas.cart import CartItemRequest, CartResponse
from app.schemas.common import ApiResponse
from app.deps import get_cart_service, get_current_user, require_user

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("", response_model=ApiResponse)
def get_cart(
    request: Request,
    cart_service: CartService = Depends(get_cart_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    cart = cart_service.get_cart(username)
    return ApiResponse.success_response(data=cart)

@router.post("/add", response_model=ApiResponse)
def add_item_to_cart(
    request: CartItemRequest,
    cart_service: CartService = Depends(get_cart_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    cart = cart_service.add_item_to_cart(username, request.productId, request.quantity)
    return ApiResponse.success_response("Item added to cart", cart)

@router.put("/update", response_model=ApiResponse)
def update_cart_item(
    request: CartItemRequest,
    cart_service: CartService = Depends(get_cart_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    cart = cart_service.update_cart_item(username, request.productId, request.quantity)
    return ApiResponse.success_response("Cart item updated", cart)

@router.delete("/remove/{productId}", response_model=ApiResponse)
def remove_item_from_cart(
    productId: int,
    cart_service: CartService = Depends(get_cart_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    cart_service.remove_item_from_cart(username, productId)
    return ApiResponse.success_response("Item removed from cart")

@router.delete("/clear", response_model=ApiResponse)
def clear_cart(
    cart_service: CartService = Depends(get_cart_service),
    current_user: dict = Depends(require_user)
) -> Any:
    username = current_user["sub"]
    cart_service.clear_cart(username)
    return ApiResponse.success_response("Cart cleared")
