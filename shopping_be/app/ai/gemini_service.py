import google.generativeai as genai
from app.database import settings

FALLBACK = "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau."

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


def call_gemini(prompt: str) -> str:
    _ensure_configured()
    try:
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        msg = str(exc).lower()
        if "quota" in msg or "429" in msg or "resource_exhausted" in msg:
            raise RuntimeError("AI rate limit reached. Please try again in a moment.")
        if "api_key" in msg or "403" in msg or "permission" in msg:
            raise RuntimeError("Invalid Gemini API key.")
        raise RuntimeError(f"AI service error: {exc}") from exc
