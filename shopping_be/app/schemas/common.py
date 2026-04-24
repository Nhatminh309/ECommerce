from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    message: Optional[str] = None
    data: Optional[T] = None

    @classmethod
    def success_response(
        cls, message: str = "Success", data: Optional[Any] = None
    ) -> "ApiResponse[Any]":
        return cls(success=True, message=message, data=data)

    @classmethod
    def error_response(
        cls, message: str, data: Optional[Any] = None
    ) -> "ApiResponse[Any]":
        return cls(success=False, message=message, data=data)
