import os
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.repositories.product_repository import ProductRepository
from app.repositories.product_image_repository import ProductImageRepository
from app.models.product import Product
from app.models.product_image import ProductImage
from app.exceptions import ResourceNotFoundException, InvalidRequestException
from app.schemas.product import ProductRequest, UpdateProductRequest, ProductResponseDTO

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class ProductService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.image_repo = ProductImageRepository(db)

    def create_product(self, request: ProductRequest) -> ProductResponseDTO:
        if request.price <= 0:
            raise InvalidRequestException("Price must be greater than 0")
        if request.quantity < 0:
            raise InvalidRequestException("Quantity must be 0 or greater")

        product = Product(
            name=request.name,
            description=request.description,
            price=request.price,
            quantity=request.quantity
        )

        if request.imageUrls:
            for url in request.imageUrls:
                image = ProductImage(image_url=url, product=product)
                product.images.append(image)

        product = self.product_repo.create(product)
        return self._to_response_dto(product)

    def update_product(self, product_id: int, request: UpdateProductRequest) -> ProductResponseDTO:
        product = self.product_repo.find_by_id_and_is_deleted_false(product_id)
        if not product:
            raise ResourceNotFoundException(f"Product not found with id: {product_id}")

        if request.price is not None and request.price <= 0:
            raise InvalidRequestException("Price must be greater than 0")
        if request.quantity is not None and request.quantity < 0:
            raise InvalidRequestException("Quantity must be 0 or greater")

        if request.name is not None:
            product.name = request.name
        if request.description is not None:
            product.description = request.description
        if request.price is not None:
            product.price = request.price
        if request.quantity is not None:
            product.quantity = request.quantity

        product = self.product_repo.update(product)
        return self._to_response_dto(product)

    def delete_product(self, product_id: int):
        product = self.product_repo.find_by_id_and_is_deleted_false(product_id)
        if not product:
            raise ResourceNotFoundException(f"Product not found with id: {product_id}")
        product.is_deleted = True
        self.product_repo.update(product)

    def get_product(self, product_id: int) -> ProductResponseDTO:
        product = self.product_repo.find_by_id_and_is_deleted_false(product_id)
        if not product:
            raise ResourceNotFoundException(f"Product not found with id: {product_id}")
        return self._to_response_dto(product)

    def get_all_products(self, keyword: Optional[str] = None, page: int = 0, size: int = 10) -> dict:
        skip = page * size
        if keyword:
            products = self.product_repo.search_active(keyword, skip, limit=size)
        else:
            products = self.product_repo.find_by_is_deleted_false(skip, limit=size)
        total = self.product_repo.count_active(keyword)
        return {
            "items": [self._to_response_dto(p) for p in products],
            "total": total,
            "page": page,
            "size": size
        }

    def upload_image(self, file) -> str:
        self._validate_file(file)

        filename = str(uuid.uuid4()) + self._get_extension(file.filename)
        filepath = os.path.join(UPLOAD_DIR, filename)

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        with open(filepath, "wb") as f:
            content = file.file.read()
            f.write(content)

        return f"/uploads/{filename}"

    def upload_image_absolute_url(self, file, base_url: str = "") -> str:
        relative = self.upload_image(file)
        return f"{base_url}{relative}"

    def add_images_to_product(self, product_id: int, image_urls: List[str]):
        product = self.product_repo.find_by_id_and_is_deleted_false(product_id)
        if not product:
            raise ResourceNotFoundException(f"Product not found with id: {product_id}")

        for url in image_urls:
            image = ProductImage(image_url=url, product=product)
            product.images.append(image)

        self.product_repo.update(product)

    def delete_image(self, image_id: int):
        image = self.image_repo.get_by_id(image_id)
        if not image:
            raise ResourceNotFoundException(f"Product image not found with id: {image_id}")
        self.image_repo.delete(image)

    def _to_response_dto(self, product: Product) -> ProductResponseDTO:
        return ProductResponseDTO(
            id=product.id,
            name=product.name,
            description=product.description,
            price=product.price,
            quantity=product.quantity,
            created_at=product.created_at,
            imageUrls=[img.image_url for img in product.images] if product.images else []
        )

    def _validate_file(self, file):
        if not file or file.filename is None:
            raise InvalidRequestException("File is empty or null")

        if file.size > MAX_FILE_SIZE:
            raise InvalidRequestException("File size exceeds 5MB limit")

        ext = self._get_extension(file.filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            raise InvalidRequestException("Invalid file type. Only jpg, jpeg, png, gif are allowed")

    def _get_extension(self, filename: str) -> str:
        if '.' not in filename:
            return ''
        return filename[filename.rindex('.'):]
