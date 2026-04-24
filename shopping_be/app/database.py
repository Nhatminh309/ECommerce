from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Core ──────────────────────────────────────────────────────────────────
    database_url: str = "postgresql://postgres:postgres@localhost:5432/shopping"
    jwt_secret: str = "change-me-change-me-change-me-change-me"
    jwt_expiration: int = 86400000
    upload_dir: str = "uploads/"

    # ── AI / Gemini ───────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── OnePay payment gateway ─────────────────────────────────────────────────
    onepay_merchant_id: str = ""
    onepay_access_code: str = ""
    onepay_secure_secret: str = ""
    onepay_payment_url: str = "https://mtf.onepay.vn/paygate/vpcpay.op"
    onepay_return_url: str = ""
    onepay_callback_url: str = ""
    # Protocol constants — override via env only when sandbox values change
    onepay_version: str = "2"
    onepay_command: str = "pay"
    onepay_currency: str = "VND"
    onepay_locale: str = "vn"

    class Config:
        env_file = ".env"

settings = Settings()

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
