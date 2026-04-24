"""
Payment router.

Endpoint summary
────────────────
POST /api/payment/create      → authenticated; returns gateway redirect URL
GET  /api/payment/return      → browser redirect back from OnePay
GET  /api/payment/callback    → server-to-server IPN from OnePay
POST /api/payment/callback    → same (OnePay may use either verb)

Return URL  — OnePay redirects the *user's browser* here after the user
              completes (or cancels) payment.  Must return a human-readable
              response so the browser can display it.

Callback URL — OnePay calls this *server-to-server* after processing.
               Must return the exact raw-text body that the gateway protocol
               requires:  responsecode=1&desc=confirm-success  /  …confirm-fail
"""
from typing import Optional

from fastapi import APIRouter, Depends, Request, status, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db, settings
from app.deps import require_user
from app.schemas.payment import (
    PaymentRequest,
    PaymentContext,
    PaymentCreateResponse,
    PaymentStatusResponse,
)
from app.schemas.common import ApiResponse
from app.services.payment.payment_service import PaymentService
from app.services.payment.payment_factory import PaymentServiceFactory
from app.services.payment.onepay_service import OnePayProvider
from app.repositories.payment_repository import PaymentTransactionRepository
from app.repositories.order_repository import OrderRepository
from app.enums import PaymentProviderType

router = APIRouter(prefix="/api/payment", tags=["payment"])


# ---------------------------------------------------------------------------
# Dependency: build PaymentService for each request
# ---------------------------------------------------------------------------

def _build_payment_service(db: Session) -> PaymentService:
    payment_repo = PaymentTransactionRepository(db)
    order_repo = OrderRepository(db)

    onepay = OnePayProvider(
        merchant_id=settings.onepay_merchant_id,
        access_code=settings.onepay_access_code,
        secure_secret=settings.onepay_secure_secret,
        payment_url=settings.onepay_payment_url,
        return_url=settings.onepay_return_url,
        callback_url=settings.onepay_callback_url or None,
        version=settings.onepay_version,
        command=settings.onepay_command,
        currency=settings.onepay_currency,
        locale=settings.onepay_locale,
        transaction_repo=payment_repo,
    )

    factory = PaymentServiceFactory(
        providers=[onepay],
        default_provider_type=PaymentProviderType.ONE_PAY,
    )

    return PaymentService(factory=factory, order_repo=order_repo, payment_repo=payment_repo)


def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return _build_payment_service(db)


# ---------------------------------------------------------------------------
# POST /api/payment/create
# ---------------------------------------------------------------------------

@router.post("/create", response_model=ApiResponse[PaymentCreateResponse])
def create_payment(
    request: Request,
    body: Optional[PaymentRequest] = None,
    order_id: Optional[int] = Query(default=None),
    orderId: Optional[int] = Query(default=None),
    current_user: dict = Depends(require_user),
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Create a payment transaction.
    Returns the OnePay redirect URL that the client should open in the browser.
    """
    resolved_order_id = (
        (body.order_id if body else None)
        or order_id
        or orderId
    )
    provider_type = body.provider_type if body else None

    context = PaymentContext(
        client_ip=request.client.host if request.client else "127.0.0.1",
    )
    normalized_request = PaymentRequest(
        order_id=resolved_order_id,
        provider_type=provider_type,
    )
    result = payment_service.create_payment(normalized_request, context)
    return ApiResponse.success_response(data=result)


# ---------------------------------------------------------------------------
# GET /api/payment/return   (browser redirect — user-facing)
# ---------------------------------------------------------------------------

@router.get("/return", response_model=ApiResponse[PaymentStatusResponse])
def handle_payment_return(
    request: Request,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    OnePay redirects the user's browser here after the payment attempt.

    Query parameters supplied by OnePay (vpc_*) are validated against the
    secure hash.  The response is a JSON envelope the frontend can use to
    show a success or failure page.
    """
    try:
        result = payment_service.handle_payment_response(str(request.url))
        return RedirectResponse(
            url=f"http://localhost:5173/orders"
        )
    except RuntimeError as exc:
        # Return a structured error so the browser/frontend can display it
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"success": False, "message": str(exc)},
        )


# ---------------------------------------------------------------------------
# GET|POST /api/payment/callback   (IPN — server-to-server)
# ---------------------------------------------------------------------------

@router.get("/callback")
@router.post("/callback")
def handle_payment_callback(
    request: Request,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Server-to-server IPN callback from OnePay.

    OnePay expects a specific plain-text response body — any other format
    causes it to retry the callback.  This endpoint never raises an HTTP
    error; all outcomes are expressed through the gateway-mandated body.

      Success: responsecode=1&desc=confirm-success
      Failure: responsecode=0&desc=confirm-fail
    """
    result = payment_service.handle_payment_callback(str(request.url))
    return PlainTextResponse(
        content=result.raw_response_body,
        status_code=result.http_status,
    )
