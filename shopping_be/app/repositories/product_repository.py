from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.models.product import Product

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_id_and_is_deleted_false(self, product_id: int):
        stmt = select(Product).options(selectinload(Product.images)).where(
            Product.id == product_id,
            Product.is_deleted == False
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def find_by_is_deleted_false(self, skip: int = 0, limit: int = 100):
        stmt = select(Product).options(selectinload(Product.images)).where(
            Product.is_deleted == False
        ).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def search_active(self, keyword: str, skip: int = 0, limit: int = 100):
        stmt = select(Product).options(selectinload(Product.images)).where(
            Product.is_deleted == False,
            or_(
                Product.name.ilike(f"%{keyword}%"),
                Product.description.ilike(f"%{keyword}%")
            )
        ).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def create(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product):
        self.db.delete(product)
        self.db.commit()

    def count_active(self, keyword: Optional[str] = None) -> int:
        stmt = select(func.count(Product.id)).where(Product.is_deleted == False)
        if keyword:
            stmt = stmt.where(
                or_(
                    Product.name.ilike(f"%{keyword}%"),
                    Product.description.ilike(f"%{keyword}%")
                )
            )
        result = self.db.execute(stmt).scalar()
        return result or 0
