from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional, List
from app.models.order import Order
from app.enums import OrderStatus

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_user_id(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        stmt = select(Order).where(Order.user_id == user_id).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def find_by_status(self, status: OrderStatus) -> List[Order]:
        stmt = select(Order).where(Order.status == status)
        return self.db.execute(stmt).scalars().all()

    def find_by_user_id_paginated(self, user_id: int, skip: int = 0, limit: int = 100):
        stmt = select(Order).where(Order.user_id == user_id).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def find_all_paginated(self, skip: int = 0, limit: int = 100):
        stmt = select(Order).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def find_paid_paginated(self, skip: int = 0, limit: int = 100):
        stmt = select(Order).where(Order.status == OrderStatus.PAID).offset(skip).limit(limit)
        return self.db.execute(stmt).scalars().all()

    def count_paid(self) -> int:
        stmt = select(func.count(Order.id)).where(Order.status == OrderStatus.PAID)
        return self.db.execute(stmt).scalar() or 0

    def get_by_id(self, order_id: int) -> Optional[Order]:
        stmt = select(Order).where(Order.id == order_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        self.db.delete(order)
        self.db.commit()

    def count_all(self) -> int:
        stmt = select(func.count(Order.id))
        return self.db.execute(stmt).scalar() or 0

    def count_by_user_id(self, user_id: int) -> int:
        stmt = select(func.count(Order.id)).where(Order.user_id == user_id)
        return self.db.execute(stmt).scalar() or 0
