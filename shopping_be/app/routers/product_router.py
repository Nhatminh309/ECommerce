from fastapi import APIRouter, Depends, UploadFile, File, Request
from typing import Any, List, Optional
from pydantic import BaseModel

from app.services.product_service import ProductService
from app.schemas.product import ProductRequest, UpdateProductRequest, ProductResponseDTO
from app.schemas.upload import AddImagesRequest, ImageUploadResponse
from app.schemas.common import ApiResponse
from app.deps import get_product_service, require_admin

router = APIRouter(prefix="/products", tags=["products"])

class PaginatedResponse(BaseModel):
    items: List[ProductResponseDTO]
    total: int
    page: int
    size: int

@router.get("", response_model=ApiResponse)
def get_all_products(
    keyword: Optional[str] = None,
    page: int = 0,
    size: int = 10,
    product_service: ProductService = Depends(get_product_service),
) -> Any:
    products = product_service.get_all_products(keyword, page, size)
    return ApiResponse.success_response(data=products)

@router.get("/{id}", response_model=ApiResponse)
def get_product(
    id: int,
    product_service: ProductService = Depends(get_product_service)
) -> Any:
    product = product_service.get_product(id)
    return ApiResponse.success_response(data=product)

@router.post("", response_model=ApiResponse)
def create_product(
    request: ProductRequest,
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    product = product_service.create_product(request)
    return ApiResponse.success_response("Product created successfully", product)

@router.put("/{id}", response_model=ApiResponse)
def update_product(
    id: int,
    request: UpdateProductRequest,
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    product = product_service.update_product(id, request)
    return ApiResponse.success_response("Product updated successfully", product)

@router.delete("/{id}", response_model=ApiResponse)
def delete_product(
    id: int,
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    product_service.delete_product(id)
    return ApiResponse.success_response("Product deleted successfully")

@router.post("/upload-image", response_model=ApiResponse)
def upload_image(
    file: UploadFile = File(...),
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    url = product_service.upload_image(file)
    return ApiResponse.success_response("Image uploaded successfully", url)

@router.post("/upload", response_model=ImageUploadResponse)
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    base_url = str(request.base_url).rstrip('/')
    url = product_service.upload_image_absolute_url(file, base_url)
    return ImageUploadResponse(url=url)

@router.post("/{id}/images", response_model=ApiResponse)
def add_images_to_product(
    id: int,
    request: AddImagesRequest,
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    product_service.add_images_to_product(id, request.imageUrls)
    return ApiResponse.success_response("Images added successfully")

@router.delete("/images/{imageId}", response_model=ApiResponse)
def delete_product_image(
    imageId: int,
    product_service: ProductService = Depends(get_product_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    product_service.delete_image(imageId)
    return ApiResponse.success_response("Image deleted successfully")
