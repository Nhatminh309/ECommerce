import base64
import hashlib
from datetime import datetime, timedelta

# passlib 1.7.4 reads bcrypt.__about__.__version__ which was removed in bcrypt 4.0.
# Add a shim so passlib can detect the version without crashing.
import bcrypt as _bcrypt_mod
if not hasattr(_bcrypt_mod, '__about__'):
    _bcrypt_mod.__about__ = type('_About', (), {'__version__': _bcrypt_mod.__version__})()

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.enums import Role
from app.exceptions import DuplicateResourceException, InvalidRequestException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, UserDto
from app.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _prehash_password(password: str) -> str:
    # bcrypt silently truncated inputs >72 bytes in v3.x; v4.x raises ValueError instead.
    # Pre-hashing with SHA-256 then base64-encoding always produces a 44-char ASCII
    # string (well under 72 bytes), so bcrypt receives a fixed-length input regardless
    # of how long the original password is.
    # WARNING: changing this function invalidates all existing stored hashes.
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("ascii")


def hash_password(password: str) -> str:
    return pwd_context.hash(_prehash_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prehash_password(plain_password), hashed_password)


class AuthService:
    def __init__(self, db: Session):
        self.user_repository = UserRepository(db)

    def register(self, username: str, password: str, confirm_password: str) -> AuthResponse:
        if password != confirm_password:
            raise InvalidRequestException("Passwords do not match")

        if self.user_repository.exists_by_username(username):
            raise DuplicateResourceException("Username already exists")

        user = User(
            username=username,
            password=hash_password(password),
            role=Role.CUSTOMER.value
        )
        user = self.user_repository.create(user)

        token = self._create_token(user.username, user.role)
        return AuthResponse(token=token, username=user.username, role=user.role)

    def login(self, username: str, password: str) -> AuthResponse:
        user = self.user_repository.find_by_username(username)
        if not user:
            raise InvalidRequestException("Invalid username or password")

        if user.is_deleted:
            raise InvalidRequestException("Account is deactivated")

        if not verify_password(password, user.password):
            raise InvalidRequestException("Invalid username or password")

        token = self._create_token(user.username, user.role)
        return AuthResponse(token=token, username=user.username, role=user.role)

    def get_current_user(self, username: str) -> UserDto:
        user = self.user_repository.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")
        return UserDto(id=user.id, username=user.username, role=user.role)

    def get_user_by_id(self, user_id: int) -> UserDto:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise InvalidRequestException("User not found with id: " + str(user_id))
        return UserDto(id=user.id, username=user.username, role=user.role)

    def _create_token(self, username: str, role: str) -> str:
        payload = {
            "sub": username,
            "role": role,
            "exp": datetime.utcnow() + timedelta(seconds=settings.jwt_expiration)
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    def verify_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise InvalidRequestException("Token has expired")
        except jwt.JWTError:
            raise InvalidRequestException("Invalid token")
