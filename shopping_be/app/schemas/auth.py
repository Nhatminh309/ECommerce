from pydantic import BaseModel, Field, validator
from typing import Optional
from app.schemas.common import ApiResponse

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    confirmPassword: str = Field(...)

    @validator('confirmPassword')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class AuthRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    token: str
    username: str
    role: str

class UserDto(BaseModel):
    id: int
    username: str
    role: str
