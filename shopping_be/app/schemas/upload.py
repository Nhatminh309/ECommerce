from pydantic import BaseModel, Field
from app.enums import OrderStatus


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus


class AddImagesRequest(BaseModel):
    imageUrls: list[str] = Field(..., min_length=1)


class UploadResponse(BaseModel):
    url: str


class ImageUploadResponse(BaseModel):
    url: str
