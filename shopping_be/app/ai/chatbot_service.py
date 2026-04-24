import json
from sqlalchemy.orm import Session
from app.database import settings
from app.models.product import Product
from app.models.order import Order
from app.ai.gemini_service import call_gemini

FALLBACK = "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau."

COMBINED_SYSTEM = """You are a customer support assistant for an online shopping store.
Given the user's question and optional context, respond with a JSON object (no markdown, no code fences) in this exact shape:
{{"intent": "<intent>", "answer": "<answer>"}}

Rules:
- intent must be exactly one of: product, order, support
  - product: questions about products, prices, availability, features
  - order: questions about the user's orders, delivery, order status
  - support: complaints, returns, escalation, or anything else
- answer must be concise, helpful, and in the same language as the user's question
- If context is provided, base the answer on it; if not, say you don't have that information
- For support intent, answer must be: "Chúng tôi sẽ kết nối bạn với nhân viên CSKH. Vui lòng chờ trong giây lát hoặc liên hệ hotline để được hỗ trợ nhanh hơn."
- Return ONLY the JSON object, nothing else"""


def _parse_combined(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(line for line in lines if not line.startswith("```")).strip()
    try:
        parsed = json.loads(raw)
        intent = parsed.get("intent", "support").lower()
        if intent not in ("product", "order", "support"):
            intent = "support"
        return {"intent": intent, "answer": parsed.get("answer", FALLBACK)}
    except (json.JSONDecodeError, KeyError):
        return {"intent": "support", "answer": FALLBACK}


class ChatbotService:
    def __init__(self, db: Session):
        self.db = db

    def _handle_product(self, question: str) -> dict:
        products = (
            self.db.query(Product)
            .filter(Product.is_deleted == False)
            .limit(20)
            .all()
        )
        context = "\n".join(
            f"- {p.name}: price={p.price}, quantity={p.quantity}, description={p.description or ''}"
            for p in products
        )
        prompt = (
            f"{COMBINED_SYSTEM}\n\n"
            f"Context (product catalog):\n{context}\n\n"
            f"User question: {question}"
        )
        raw = call_gemini(prompt)
        result = _parse_combined(raw)
        result["data"] = [
            {"id": p.id, "name": p.name, "price": float(p.price), "quantity": p.quantity}
            for p in products
        ]
        return result

    def _handle_order(self, question: str, user_id: int | None) -> dict:
        if user_id is None:
            return {
                "intent": "order",
                "answer": "Vui lòng đăng nhập để xem thông tin đơn hàng của bạn.",
                "data": [],
            }
        orders = (
            self.db.query(Order)
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .limit(10)
            .all()
        )
        context = "\n".join(
            f"- Order #{o.id}: status={o.status}, total={o.total_price}, created={o.created_at}"
            for o in orders
        )
        prompt = (
            f"{COMBINED_SYSTEM}\n\n"
            f"Context (user's orders):\n{context}\n\n"
            f"User question: {question}"
        )
        raw = call_gemini(prompt)
        result = _parse_combined(raw)
        result["data"] = [
            {
                "id": o.id,
                "status": o.status.value if hasattr(o.status, "value") else str(o.status),
                "total_price": float(o.total_price),
                "created_at": str(o.created_at),
            }
            for o in orders
        ]
        return result

    def _handle_support(self, question: str) -> dict:
        return {
            "intent": "support",
            "answer": (
                "Chúng tôi sẽ kết nối bạn với nhân viên CSKH. "
                "Vui lòng chờ trong giây lát hoặc liên hệ hotline để được hỗ trợ nhanh hơn."
            ),
            "data": None,
        }

    def chat(self, question: str, user_id: int | None = None) -> dict:
        if not settings.gemini_api_key:
            return {
                "intent": "error",
                "answer": "AI service not configured. Please set GEMINI_API_KEY.",
                "data": None,
            }

        # Single Gemini call to both classify and get a preliminary answer
        prompt = f"{COMBINED_SYSTEM}\n\nUser question: {question}"
        try:
            raw = call_gemini(prompt)
            result = _parse_combined(raw)
            intent = result["intent"]

            if intent == "product":
                return self._handle_product(question)
            elif intent == "order":
                return self._handle_order(question, user_id)
            else:
                return self._handle_support(question)

        except RuntimeError as exc:
            return {"intent": "error", "answer": str(exc), "data": None}
        except Exception as exc:
            return {"intent": "error", "answer": f"Unexpected error: {exc}", "data": None}
