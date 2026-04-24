from sqlalchemy.orm import Session
from typing import Optional
from app.models.payment_transaction import PaymentTransaction


class PaymentTransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_transaction_ref(self, transaction_ref: str) -> Optional[PaymentTransaction]:
        return (
            self.db.query(PaymentTransaction)
            .filter(PaymentTransaction.transaction_ref == transaction_ref)
            .first()
        )

    def find_by_order_id(self, order_id: int) -> Optional[PaymentTransaction]:
        return (
            self.db.query(PaymentTransaction)
            .filter(PaymentTransaction.order_id == order_id)
            .first()
        )

    def create(self, transaction: PaymentTransaction) -> PaymentTransaction:
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def update(self, transaction: PaymentTransaction) -> PaymentTransaction:
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
