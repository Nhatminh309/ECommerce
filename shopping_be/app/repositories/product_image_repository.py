from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.product_image import ProductImage

class ProductImageRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_product_id(self, product_id: int) -> List[ProductImage]:
        stmt = select(ProductImage).where(ProductImage.product_id == product_id)
        return self.db.execute(stmt).scalars().all()

    def delete_by_product_id(self, product_id: int):
        stmt = select(ProductImage).where(ProductImage.product_id == product_id)
        images = self.db.execute(stmt).scalars().all()
        for image in images:
            self.db.delete(image)
        self.db.commit()

    def get_by_id(self, image_id: int) -> Optional[ProductImage]:
        stmt = select(ProductImage).where(ProductImage.id == image_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, image: ProductImage) -> ProductImage:
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def delete(self, image: ProductImage):
        self.db.delete(image)
        self.db.commit()
