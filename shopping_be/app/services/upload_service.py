import os
import uuid
from typing import Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.repositories.product_image_repository import ProductImageRepository
from app.models.product_image import ProductImage
from app.exceptions import InvalidRequestException

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif'}
ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class UploadService:
    def __init__(self, db: Session):
        self.image_repo = ProductImageRepository(db)

    def upload_image(self, file: UploadFile) -> str:
        self._validate_file(file)

        filename = str(uuid.uuid4()) + self._get_extension(file.filename)
        filepath = os.path.join(UPLOAD_DIR, filename)

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        with open(filepath, "wb") as f:
            content = file.file.read()
            f.write(content)

        return f"/uploads/{filename}"

    def _validate_file(self, file: UploadFile):
        if not file or file.filename is None:
            raise InvalidRequestException("File is empty or null")

        # Check file size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)

        if size > MAX_FILE_SIZE:
            raise InvalidRequestException("File size exceeds 5MB limit")

        ext = self._get_extension(file.filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            raise InvalidRequestException("Invalid file type. Only jpg, jpeg, png, gif are allowed")

        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise InvalidRequestException("Invalid content type. Only image files are allowed")

    def _get_extension(self, filename: str) -> str:
        if '.' not in filename:
            return ''
        return filename[filename.rindex('.'):]
