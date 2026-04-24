"""
OnePay payment provider — exact port of OnePayProvider.java.

Key behaviours preserved:
- Amount in gateway = amount_vnd * 100  (OnePay uses smallest currency unit)
- Hash verification before any status decision
- Success-code + bad-hash → PENDING (requires QueryDR to confirm)
- IPN: if already SUCCESS, return confirm-success immediately
- sanitizeOrderInfo removes  ( ) / & ?  characters
- parseUrlParameters URL-decodes both keys and values
"""
import re
from decimal import Decimal
from urllib.parse import quote, unquote
from typing import Optional

from app.services.payment.base import PaymentProvider
from app.services.payment import onepay_hash_util as hash_util
from app.models.payment_transaction import PaymentTransaction
from app.repositories.payment_repository import PaymentTransactionRepository
from app.schemas.payment import PaymentContext, PaymentIpnResult
from app.enums import PaymentProviderType, PaymentStatus

_IPN_SUCCESS = "responsecode=1&desc=confirm-success"
_IPN_FAIL = "responsecode=0&desc=confirm-fail"


class OnePayProvider(PaymentProvider):

    def __init__(
        self,
        merchant_id: str,
        access_code: str,
        secure_secret: str,
        payment_url: str,
        return_url: str,
        callback_url: Optional[str],
        version: str,
        command: str,
        currency: str,
        locale: str,
        transaction_repo: PaymentTransactionRepository,
    ):
        self._validate_config(merchant_id, access_code, secure_secret, payment_url, return_url)
        self.merchant_id = merchant_id
        self.access_code = access_code
        self.secure_secret = secure_secret
        self.payment_url = payment_url
        self.return_url = return_url
        self.callback_url = callback_url
        self.version = version
        self.command = command
        self.currency = currency
        self.locale = locale
        self.transaction_repo = transaction_repo

    @staticmethod
    def _validate_config(
        merchant_id: str,
        access_code: str,
        secure_secret: str,
        payment_url: str,
        return_url: str,
    ) -> None:
        if not merchant_id or not merchant_id.strip():
            raise ValueError("OnePay merchantId is not configured")
        if not access_code or not access_code.strip():
            raise ValueError("OnePay accessCode is not configured")
        if not secure_secret or not secure_secret.strip():
            raise ValueError("OnePay secureSecret is not configured")
        if not payment_url or not payment_url.strip():
            raise ValueError("OnePay paymentUrl is not configured")
        if not return_url or not return_url.strip():
            raise ValueError("OnePay returnUrl is not configured")

    # ------------------------------------------------------------------
    # PaymentProvider interface
    # ------------------------------------------------------------------

    def get_payment_type(self) -> PaymentProviderType:
        return PaymentProviderType.ONE_PAY

    def make_payment_request(
        self, transaction: PaymentTransaction, context: PaymentContext
    ) -> str:
        return self._build_payment_url(transaction, context)

    def handle_payment_response(self, payment_response_url: str) -> PaymentTransaction:
        try:
            params = self._parse_url_parameters(payment_response_url)

            transaction_ref = params.get("vpc_MerchTxnRef", "")
            merchant_id = params.get("vpc_Merchant", "")
            amount_str = params.get("vpc_Amount", "0")
            response_code = params.get("vpc_TxnResponseCode", "")
            message = params.get("vpc_Message", "")
            received_hash = params.get("vpc_SecureHash", "")

            if not transaction_ref or not transaction_ref.strip():
                raise RuntimeError("Missing vpc_MerchTxnRef in response")

            transaction = self.transaction_repo.find_by_transaction_ref(transaction_ref)
            if transaction is None:
                raise RuntimeError(f"PaymentTransaction not found for ref: {transaction_ref}")

            # --- merchant check ---
            if self.merchant_id != merchant_id:
                transaction.status = PaymentStatus.FAILED
                transaction.response_code = response_code
                transaction.response_message = "Merchant ID mismatch"
                transaction.raw_response = payment_response_url
                return self.transaction_repo.update(transaction)

            # --- hash verification ---
            is_valid_hash = hash_util.verify_secure_hash(
                params, self.secure_secret, received_hash
            )

            # Amount comparison (OnePay sends VND * 100)
            response_amount = int(amount_str)
            response_amount_in_vnd = response_amount // 100

            is_success_code = response_code == "0"

            if is_success_code and not is_valid_hash:
                transaction.status = PaymentStatus.PENDING
                transaction.response_code = response_code
                transaction.response_message = "Hash mismatch - need QueryDR"
                transaction.raw_response = payment_response_url
                return self.transaction_repo.update(transaction)

            if not is_valid_hash:
                transaction.status = PaymentStatus.FAILED
                transaction.response_code = response_code
                transaction.response_message = "SecureHash verification failed"
                transaction.raw_response = payment_response_url
                return self.transaction_repo.update(transaction)

            if is_success_code:
                expected = transaction.amount
                if expected is not None and expected != Decimal(response_amount_in_vnd):
                    transaction.status = PaymentStatus.FAILED
                    transaction.response_message = "Amount mismatch"
                else:
                    transaction.status = PaymentStatus.SUCCESS
            else:
                transaction.status = PaymentStatus.FAILED

            transaction.response_code = response_code
            transaction.response_message = message
            transaction.raw_response = payment_response_url
            return self.transaction_repo.update(transaction)

        except Exception as exc:
            raise RuntimeError(f"Failed to handle payment response: {exc}") from exc

    def handle_payment_ipn_response(self, ipn_response_url: str) -> PaymentIpnResult:
        try:
            params = self._parse_url_parameters(ipn_response_url)
            transaction_ref = params.get("vpc_MerchTxnRef", "")

            if not transaction_ref or not transaction_ref.strip():
                raise RuntimeError("Missing vpc_MerchTxnRef in IPN response")

            transaction = self.transaction_repo.find_by_transaction_ref(transaction_ref)
            if transaction is None:
                raise RuntimeError(f"PaymentTransaction not found for ref: {transaction_ref}")

            if transaction.status == PaymentStatus.SUCCESS:
                return PaymentIpnResult(
                    success=True,
                    raw_response_body=_IPN_SUCCESS,
                    http_status=200,
                )

            transaction = self.handle_payment_response(ipn_response_url)

            if transaction.status == PaymentStatus.SUCCESS:
                return PaymentIpnResult(
                    success=True,
                    raw_response_body=_IPN_SUCCESS,
                    http_status=200,
                )

            return PaymentIpnResult(
                success=False,
                raw_response_body=_IPN_FAIL,
                http_status=400,
            )

        except Exception:
            return PaymentIpnResult(
                success=False,
                raw_response_body=_IPN_FAIL,
                http_status=400,
            )

    def make_refund_request(self, refund_ref: str) -> str:
        raise NotImplementedError("Refund not implemented")

    def handle_refund_response(self, refund_response_url: str) -> None:
        pass

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_payment_url(
        self, transaction: PaymentTransaction, context: PaymentContext
    ) -> str:
        order_info = f"Order-{transaction.order_id}" if transaction.order_id else "Order"

        params: dict = {}
        params["vpc_Version"] = self.version
        params["vpc_Command"] = self.command
        params["vpc_AccessCode"] = self.access_code
        params["vpc_Merchant"] = self.merchant_id
        params["vpc_Currency"] = self.currency
        params["vpc_Locale"] = self.locale
        params["vpc_ReturnURL"] = self.return_url
        params["vpc_MerchTxnRef"] = transaction.transaction_ref
        params["vpc_OrderInfo"] = self._sanitize_order_info(order_info)
        params["vpc_Amount"] = str(int(Decimal(str(transaction.amount)) * 100))
        params["vpc_TicketNo"] = context.client_ip

        if self.callback_url:
            params["vpc_CallbackURL"] = self.callback_url

        secure_hash = hash_util.create_secure_hash(params, self.secure_secret)
        params["vpc_SecureHash"] = secure_hash

        query_string = hash_util.build_query_string(params)
        return f"{self.payment_url}?{query_string}"

    def _parse_url_parameters(self, url: str) -> dict:
        params: dict = {}
        query_index = url.find("?")
        if query_index == -1:
            return params
        query_string = url[query_index + 1:]
        for pair in query_string.split("&"):
            eq = pair.find("=")
            if eq > 0:
                key = unquote(pair[:eq])
                value = unquote(pair[eq + 1:])
                params[key] = value
        return params

    @staticmethod
    def _sanitize_order_info(input_str: str) -> str:
        return re.sub(r"[()/&?]", "", input_str)
