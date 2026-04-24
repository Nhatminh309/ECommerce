from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.order_item import OrderItem

class OrderItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_order_id(self, order_id: int) -> List[OrderItem]:
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        return self.db.execute(stmt).scalars().all()

    def create_many(self, order_items: List[OrderItem]):
        self.db.add_all(order_items)
        self.db.commit()
        for item in order_items:
            self.db.refresh(item)
