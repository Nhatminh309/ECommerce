from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, AuthRequest, AuthResponse, UserDto
from app.schemas.common import ApiResponse
from app.deps import get_auth_service, get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=ApiResponse)
def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    response = auth_service.register(
        username=request.username,
        password=request.password,
        confirm_password=request.confirmPassword
    )
    return ApiResponse.success_response("Registration successful", response)

@router.post("/login", response_model=ApiResponse)
def login(
    request: AuthRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    response = auth_service.login(username=request.username, password=request.password)
    return ApiResponse.success_response("Login successful", response)

@router.get("/me", response_model=ApiResponse)
def get_current_user(
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
) -> Any:
    user_dto = auth_service.get_current_user(current_user["sub"])
    return ApiResponse.success_response(data=user_dto)

@router.get("/user/{userId}", response_model=ApiResponse)
def get_user_by_id(
    userId: int,
    auth_service: AuthService = Depends(get_auth_service),
    admin: dict = Depends(require_admin)
) -> Any:
    user_dto = auth_service.get_user_by_id(userId)
    return ApiResponse.success_response(data=user_dto)
