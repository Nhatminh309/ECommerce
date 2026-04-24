from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    PAID = "PAID"
    FAILED = "FAILED"

class PaymentProviderType(str, Enum):
    ONE_PAY = "ONE_PAY"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
