from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Any, Annotated
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.product_service import ProductService
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.upload_service import UploadService
from app.services.payment.payment_service import PaymentService
from app.enums import Role

def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)

def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(db)

def get_cart_service(db: Session = Depends(get_db)) -> CartService:
    return CartService(db)

def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)

def get_upload_service(db: Session = Depends(get_db)) -> UploadService:
    return UploadService(db)

def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    from app.routers.payment_router import _build_payment_service
    return _build_payment_service(db)

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service)
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    try:
        payload = auth_service.verify_token(token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_user(current_user: dict = Depends(get_current_user)):
    # Both admin and customer are allowed
    if current_user.get("role") not in [Role.ADMIN, Role.CUSTOMER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user
