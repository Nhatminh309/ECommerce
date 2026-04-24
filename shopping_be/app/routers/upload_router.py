from fastapi import APIRouter, Depends, Request, UploadFile, File, status
from typing import Any

from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse
from app.deps import get_upload_service, require_admin

router = APIRouter(prefix="/api", tags=["upload"])

@router.post("/upload", response_model=UploadResponse)
async def upload(
    request: Request,
    file: UploadFile = File(...),
    upload_service: UploadService = Depends(get_upload_service),
    current_user: dict = Depends(require_admin)
) -> Any:
    base_url = str(request.base_url).rstrip('/')
    relative_path = upload_service.upload_image(file)
    absolute_url = f"{base_url}{relative_path}"
    return UploadResponse(url=absolute_url)
