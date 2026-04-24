from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProductRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., ge=0)
    imageUrls: list[str] = Field(default_factory=list)


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    quantity: int
    created_at: datetime
    imageUrls: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ProductResponseDTO(ProductResponse):
    pass
