from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from app.database import engine, Base
from app.deps import get_product_service, get_cart_service, get_order_service, get_auth_service
from app.routers.auth_router import router as auth_router
from app.routers.product_router import router as product_router
from app.routers.cart_router import router as cart_router
from app.routers.order_router import router as order_router
from app.routers.upload_router import router as upload_router
from app.routers.payment_router import router as payment_router
from app.routers.ai_router import router as ai_router
from app.routers.category_router import router as category_router
from app.routers.chat_router import router as chat_router
from app.routers.admin_router import router as admin_router
from app.exceptions import (
    ResourceNotFoundException,
    InsufficientStockException,
    InvalidRequestException,
    DuplicateResourceException
)

# Import all models to ensure they are registered with Base.metadata
from app.models import user, product, product_image, cart, cart_item, order, order_item
from app.models import payment_transaction
from app.models import category, chat

app = FastAPI(title="Shopping API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Shopping API", "status": "running"}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:] if loc != "body")
        errors[field] = error["msg"]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Validation failed", "data": errors}
    )

@app.exception_handler(ResourceNotFoundException)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundException):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"success": False, "message": f"Resource not found: {exc.message}"}
    )

@app.exception_handler(InsufficientStockException)
async def insufficient_stock_handler(request: Request, exc: InsufficientStockException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "message": f"Insufficient stock: {exc.message}"}
    )

@app.exception_handler(InvalidRequestException)
async def invalid_request_handler(request: Request, exc: InvalidRequestException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "message": f"Invalid request: {exc.message}"}
    )

@app.exception_handler(DuplicateResourceException)
async def duplicate_resource_handler(request: Request, exc: DuplicateResourceException):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"success": False, "message": f"Duplicate resource: {exc.message}"}
    )

# Include routers
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(upload_router)
app.include_router(payment_router)
app.include_router(ai_router)
app.include_router(category_router)
app.include_router(chat_router)
app.include_router(admin_router)
