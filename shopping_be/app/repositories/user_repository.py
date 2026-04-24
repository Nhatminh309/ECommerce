from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import Optional, List
from app.models.user import User

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        return self.db.execute(stmt).scalar_one_or_none()

    def exists_by_username(self, username: str) -> bool:
        stmt = select(func.count(User.id)).where(User.username == username)
        return self.db.execute(stmt).scalar() > 0

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: int) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def find_all_paginated(self, skip: int = 0, limit: int = 20) -> List[User]:
        stmt = select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
        return self.db.execute(stmt).scalars().all()

    def count_all(self) -> int:
        stmt = select(func.count(User.id))
        return self.db.execute(stmt).scalar() or 0

    def update(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
