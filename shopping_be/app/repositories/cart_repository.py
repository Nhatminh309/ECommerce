from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from app.models.cart import Cart

class CartRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_user_id(self, user_id: int) -> Optional[Cart]:
        stmt = select(Cart).where(Cart.user_id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def find_by_user_username(self, username: str) -> Optional[Cart]:
        stmt = select(Cart).join(Cart.user).where(
            Cart.user.has(username=username)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, cart: Cart) -> Cart:
        self.db.add(cart)
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def get_by_id(self, cart_id: int) -> Optional[Cart]:
        stmt = select(Cart).where(Cart.id == cart_id)
        return self.db.execute(stmt).scalar_one_or_none()
