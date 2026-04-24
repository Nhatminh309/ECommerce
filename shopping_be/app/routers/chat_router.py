from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_auth_service, require_admin, require_user
from app.repositories.user_repository import UserRepository
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class MessageRequest(BaseModel):
    content: str


class AdminReplyRequest(BaseModel):
    content: str


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_user_id_from_jwt(current_user: dict, db: Session) -> int:
    """Resolve the numeric user id from the JWT payload (which only contains sub/role)."""
    username = current_user["sub"]
    repo = UserRepository(db)
    user = repo.find_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.id


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/message", response_model=ApiResponse)
def send_message(
    body: MessageRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_user),
) -> Any:
    """Customer sends a chat message; AI replies automatically."""
    user_id = _get_user_id_from_jwt(current_user, db)
    service = ChatService(db)
    result = service.send_message(user_id, body.content)
    return ApiResponse.success_response("Message sent", result)


@router.get("/my", response_model=ApiResponse)
def get_my_conversation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_user),
) -> Any:
    """Get the current user's active conversation with all messages."""
    user_id = _get_user_id_from_jwt(current_user, db)
    service = ChatService(db)
    result = service.get_my_conversation(user_id)
    return ApiResponse.success_response(data=result)


@router.get("/conversations", response_model=ApiResponse)
def list_conversations(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Admin: list all conversations with summary info."""
    service = ChatService(db)
    result = service.get_all_conversations()
    return ApiResponse.success_response(data=result)


@router.get("/conversations/{id}", response_model=ApiResponse)
def get_conversation(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Admin: get full conversation detail including all messages."""
    service = ChatService(db)
    result = service.get_conversation_messages(id)
    return ApiResponse.success_response(data=result)


@router.post("/conversations/{id}/reply", response_model=ApiResponse)
def admin_reply(
    id: int,
    body: AdminReplyRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Admin: send a reply message in a conversation."""
    service = ChatService(db)
    result = service.admin_reply(id, body.content)
    return ApiResponse.success_response("Reply sent", result)


@router.post("/conversations/{id}/close", response_model=ApiResponse)
def close_conversation(
    id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Any:
    """Admin: close a conversation."""
    service = ChatService(db)
    result = service.close_conversation(id)
    return ApiResponse.success_response("Conversation closed", result)
