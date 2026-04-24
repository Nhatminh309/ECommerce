from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from app.enums import PaymentProviderType, PaymentStatus


class PaymentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    order_id: Optional[int] = Field(default=None, alias="orderId")
    provider_type: Optional[PaymentProviderType] = Field(default=None, alias="providerType")


class PaymentContext(BaseModel):
    client_ip: str
    locale: str = "vn"


class PaymentCreateResponse(BaseModel):
    payment_url: str
    transaction_ref: str


class PaymentStatusResponse(BaseModel):
    success: bool
    transaction_ref: str
    response_code: Optional[str] = None
    message: Optional[str] = None
    amount: Optional[int] = None


class PaymentIpnResult(BaseModel):
    success: bool
    raw_response_body: str
    http_status: int
