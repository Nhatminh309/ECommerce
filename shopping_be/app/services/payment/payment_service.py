"""
Port of PaymentService.java.

Orchestrates the payment flow:
  1. createPayment  → validates order → creates PaymentTransaction → returns gateway URL
  2. handlePaymentResponse → delegates to provider → returns PaymentStatusResponse DTO
  3. handlePaymentCallback → delegates IPN to provider → returns PaymentIpnResult
"""
import uuid
from decimal import Decimal
from urllib.parse import unquote
from typing import Optional

from sqlalchemy.orm import Session

from app.services.payment.payment_factory import PaymentServiceFactory
from app.repositories.order_repository import OrderRepository
from app.repositories.payment_repository import PaymentTransactionRepository
from app.models.payment_transaction import PaymentTransaction
from app.schemas.payment import (
    PaymentRequest,
    PaymentContext,
    PaymentCreateResponse,
    PaymentStatusResponse,
    PaymentIpnResult,
)
from app.enums import OrderStatus, PaymentStatus
from app.exceptions import ResourceNotFoundException, InvalidRequestException


class PaymentService:

    def __init__(
        self,
        factory: PaymentServiceFactory,
        order_repo: OrderRepository,
        payment_repo: PaymentTransactionRepository,
    ):
        self.factory = factory
        self.order_repo = order_repo
        self.payment_repo = payment_repo

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def create_payment(
        self, request: PaymentRequest, context: PaymentContext
    ) -> PaymentCreateResponse:
        if request.order_id is None:
            raise InvalidRequestException("order_id is required")

        provider = self.factory.get_payment_provider()

        order = self.order_repo.get_by_id(request.order_id)
        if order is None:
            raise ResourceNotFoundException(f"Order not found: {request.order_id}")

        if order.status == OrderStatus.PAID:
            raise InvalidRequestException("Order is already paid")

        if order.total_price <= 0:
            raise InvalidRequestException("Total amount must be greater than zero")

        transaction = PaymentTransaction(
            transaction_ref=self._generate_transaction_ref(),
            provider=provider.get_payment_type(),
            amount=order.total_price,
            status=PaymentStatus.PENDING,
            order_id=order.id,
        )
        transaction = self.payment_repo.create(transaction)

        payment_url = provider.make_payment_request(transaction, context)
        return PaymentCreateResponse(
            payment_url=payment_url,
            transaction_ref=transaction.transaction_ref,
        )

    def handle_payment_response(self, response_url: str) -> PaymentStatusResponse:
        provider = self.factory.get_payment_provider()
        transaction = provider.handle_payment_response(response_url)

        # Sync order status with payment transaction
        if transaction.order_id:
            order = self.order_repo.get_by_id(transaction.order_id)
            if order:
                from app.enums import PaymentStatus
                if transaction.status == PaymentStatus.SUCCESS:
                    order.status = OrderStatus.PAID
                elif transaction.status == PaymentStatus.FAILED:
                    order.status = OrderStatus.FAILED
                self.order_repo.update(order)

        return PaymentStatusResponse(
            success=transaction.status == PaymentStatus.SUCCESS,
            transaction_ref=transaction.transaction_ref,
            response_code=transaction.response_code,
            message=transaction.response_message,
            amount=int(transaction.amount) if transaction.amount is not None else None,
        )

    def handle_payment_callback(self, response_url: str) -> PaymentIpnResult:
        provider = self.factory.get_payment_provider()
        result = provider.handle_payment_ipn_response(response_url)

        # If payment was successful, update order status
        if result.success:
            # We need to get the transaction from the callback URL
            params = provider._parse_url_parameters(response_url)
            transaction_ref = params.get("vpc_MerchTxnRef", "")
            if transaction_ref:
                transaction = self.payment_repo.find_by_transaction_ref(transaction_ref)
                if transaction and transaction.order_id:
                    order = self.order_repo.get_by_id(transaction.order_id)
                    if order:
                        from app.enums import PaymentStatus, OrderStatus
                        if transaction.status == PaymentStatus.SUCCESS:
                            order.status = OrderStatus.PAID
                        elif transaction.status == PaymentStatus.FAILED:
                            order.status = OrderStatus.FAILED
                        self.order_repo.update(order)

        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_transaction_ref() -> str:
        return "COLE_" + str(uuid.uuid4()).replace("-", "")

    @staticmethod
    def _extract_transaction_ref(payment_url: str) -> Optional[str]:
        marker = "vpc_MerchTxnRef="
        idx = payment_url.find(marker)
        if idx == -1:
            return None
        start = idx + len(marker)
        end = payment_url.find("&", start)
        if end == -1:
            end = len(payment_url)
        return unquote(payment_url[start:end])
