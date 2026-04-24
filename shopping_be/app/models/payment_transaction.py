from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Enum as SAEnum
from sqlalchemy.sql import func
from app.database import Base
from app.enums import PaymentProviderType, PaymentStatus


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, nullable=True)
    transaction_ref = Column(String(100), unique=True, nullable=False, index=True)
    provider = Column(SAEnum(PaymentProviderType), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    status = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    response_code = Column(String(20))
    response_message = Column(String(500))
    raw_response = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
