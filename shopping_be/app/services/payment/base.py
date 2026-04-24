from abc import ABC, abstractmethod
from app.models.payment_transaction import PaymentTransaction
from app.schemas.payment import PaymentContext, PaymentIpnResult
from app.enums import PaymentProviderType


class PaymentProvider(ABC):

    @abstractmethod
    def get_payment_type(self) -> PaymentProviderType:
        pass

    @abstractmethod
    def make_payment_request(
        self, transaction: PaymentTransaction, context: PaymentContext
    ) -> str:
        """Initiate payment and return the redirect URL."""
        pass

    @abstractmethod
    def handle_payment_response(self, payment_response_url: str) -> PaymentTransaction:
        """Process the user return from payment gateway. Returns updated transaction."""
        pass

    @abstractmethod
    def handle_payment_ipn_response(self, ipn_response_url: str) -> PaymentIpnResult:
        """Handle server-to-server IPN callback from payment gateway."""
        pass

    @abstractmethod
    def make_refund_request(self, refund_ref: str) -> str:
        pass

    @abstractmethod
    def handle_refund_response(self, refund_response_url: str) -> None:
        pass
