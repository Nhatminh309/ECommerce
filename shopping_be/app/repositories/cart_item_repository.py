from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List
from app.models.cart_item import CartItem

class CartItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_cart_id_and_product_id(self, cart_id: int, product_id: int) -> Optional[CartItem]:
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def find_by_cart_id(self, cart_id: int) -> List[CartItem]:
        stmt = select(CartItem).where(CartItem.cart_id == cart_id)
        return self.db.execute(stmt).scalars().all()

    def delete_by_cart_id(self, cart_id: int):
        stmt = select(CartItem).where(CartItem.cart_id == cart_id)
        items = self.db.execute(stmt).scalars().all()
        for item in items:
            self.db.delete(item)
        self.db.commit()

    def delete_by_cart_id_and_product_id(self, cart_id: int, product_id: int):
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.product_id == product_id
        )
        item = self.db.execute(stmt).scalar_one_or_none()
        if item:
            self.db.delete(item)
            self.db.commit()

    def create(self, cart_item: CartItem) -> CartItem:
        self.db.add(cart_item)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item

    def update(self, cart_item: CartItem) -> CartItem:
        self.db.add(cart_item)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item
