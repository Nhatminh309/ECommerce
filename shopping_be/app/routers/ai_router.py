from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.deps import require_admin, get_auth_service
from app.services.auth_service import AuthService
from app.ai.chatbot_service import ChatbotService
from app.ai import document_service
from app.ai.report_service import ReportService
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/api/ai", tags=["AI"])


# ── Request/Response schemas ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[int] = None


class AskDocumentRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None


class ReportRequest(BaseModel):
    query: str


# ── Helper: try to get current user without raising on failure ─────────────────

def _try_get_user(
    authorization: Optional[str] = Header(default=None),
    auth_service: AuthService = Depends(get_auth_service),
) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        return auth_service.verify_token(token)
    except Exception:
        return None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/chat")
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(_try_get_user),
):
    user_id = body.user_id
    if user_id is None and current_user:
        username = current_user.get("sub")
        if username:
            user_repo = UserRepository(db)
            user = user_repo.find_by_username(username)
            if user:
                user_id = user.id

    service = ChatbotService(db)
    result = service.chat(body.question, user_id=user_id)
    return {"success": True, "data": result}


@router.post("/documents")
def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    content = file.file.read()
    result = document_service.upload_document(file.filename, content)
    return {"success": True, "data": result}


@router.get("/documents")
def list_documents():
    docs = document_service.list_documents()
    return {"success": True, "data": docs}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    deleted = document_service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True, "message": "Document deleted"}


@router.post("/documents/ask")
def ask_document(body: AskDocumentRequest):
    result = document_service.ask_question(body.question, doc_id=body.doc_id)
    return {"success": True, "data": result}


@router.post("/report")
def generate_report(
    body: ReportRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    service = ReportService(db)
    result = service.generate_report(body.query)
    return {"success": result["success"], "data": result}
