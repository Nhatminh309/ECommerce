from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> List[Category]:
        stmt = select(Category).where(Category.is_deleted == False)
        return self.db.execute(stmt).scalars().all()

    def get_by_id(self, category_id: int) -> Optional[Category]:
        stmt = select(Category).where(
            Category.id == category_id, Category.is_deleted == False
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_name(self, name: str) -> Optional[Category]:
        stmt = select(Category).where(Category.name == name, Category.is_deleted == False)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
