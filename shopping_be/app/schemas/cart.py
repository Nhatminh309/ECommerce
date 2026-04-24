from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class CartItemRequest(BaseModel):
    productId: int
    quantity: int = Field(..., gt=0)


class UpdateCartItemRequest(CartItemRequest):
    pass


class CartItemResponse(BaseModel):
    id: int
    productId: int
    productName: str
    price: Decimal
    quantity: int
    imageUrls: list[str] = Field(default_factory=list)
    subtotal: Decimal


class CartResponse(BaseModel):
    id: int
    userId: int
    cartItems: list[CartItemResponse] = Field(default_factory=list)
    totalItems: int
    totalPrice: Decimal
