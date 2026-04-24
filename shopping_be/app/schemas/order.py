from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CreateOrderRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1)
    note: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    productId: int
    productName: str
    quantity: int
    price: Decimal
    subtotal: Decimal
    imageUrls: list[str] = Field(default_factory=list)


class OrderResponse(BaseModel):
    id: int
    userId: int
    username: str
    totalPrice: Decimal
    status: str
    full_name: str
    phone_number: str
    address: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    orderItems: list[OrderItemResponse] = Field(default_factory=list)
