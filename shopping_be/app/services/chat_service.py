from sqlalchemy.orm import Session

from app.ai.chatbot_service import ChatbotService
from app.exceptions import ResourceNotFoundException
from app.models.chat import ConversationStatus, SenderType
from app.repositories.chat_repository import ChatRepository


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.chat_repo = ChatRepository(db)
        self.chatbot = ChatbotService(db)

    # ── Customer actions ──────────────────────────────────────────────────────

    def send_message(self, user_id: int, content: str) -> dict:
        """Customer sends a message; AI responds automatically."""
        # 1. Get or create an active conversation
        conv = self.chat_repo.get_or_create_conversation(user_id)
        # 2. Persist the customer's message
        self.chat_repo.add_message(conv.id, SenderType.CUSTOMER, content)
        # 3. Ask the AI chatbot
        ai_result = self.chatbot.chat(content, user_id=user_id)
        # 4. Persist the AI reply
        ai_msg = ai_result.get("answer", "")
        self.chat_repo.add_message(conv.id, SenderType.AI, ai_msg)
        # 5. If intent is support, escalate conversation to PENDING
        last_intent = ai_result.get("intent")
        if last_intent == "support":
            conv = self.chat_repo.update_conversation_status(conv, ConversationStatus.PENDING)
        # 6. Return full conversation view
        return self._to_response(conv, last_intent)

    def get_my_conversation(self, user_id: int) -> dict:
        """Return the user's most recent active conversation, or empty if none exists."""
        convs = self.chat_repo.get_conversations_by_user(user_id)
        if not convs:
            return {"conversation": None, "messages": [], "last_intent": None}
        return self._to_response(convs[0])

    # ── Admin actions ─────────────────────────────────────────────────────────

    def admin_reply(self, conv_id: int, content: str) -> dict:
        """Admin posts a reply to a conversation."""
        conv = self.chat_repo.get_conversation_by_id(conv_id)
        if not conv:
            raise ResourceNotFoundException("Conversation not found")
        self.chat_repo.add_message(conv_id, SenderType.ADMIN, content)
        conv = self.chat_repo.update_conversation_status(conv, ConversationStatus.OPEN)
        return self._to_response(conv)

    def close_conversation(self, conv_id: int) -> dict:
        """Admin closes a conversation."""
        conv = self.chat_repo.get_conversation_by_id(conv_id)
        if not conv:
            raise ResourceNotFoundException("Conversation not found")
        conv = self.chat_repo.update_conversation_status(conv, ConversationStatus.CLOSED)
        return self._to_response(conv)

    def get_all_conversations(self) -> list:
        """Return a summary list of all conversations (admin view)."""
        convs = self.chat_repo.get_all_conversations()
        return [self._to_conversation_summary(c) for c in convs]

    def get_conversation_messages(self, conv_id: int) -> dict:
        """Return full conversation detail for admin."""
        conv = self.chat_repo.get_conversation_by_id(conv_id)
        if not conv:
            raise ResourceNotFoundException("Conversation not found")
        return self._to_response(conv)

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _to_response(self, conv, last_intent: str | None = None) -> dict:
        msgs = self.chat_repo.get_messages(conv.id)
        return {
            "conversation": {
                "id": conv.id,
                "user_id": conv.user_id,
                "status": conv.status.value,
                "created_at": str(conv.created_at),
                "updated_at": str(conv.updated_at),
            },
            "messages": [
                {
                    "id": m.id,
                    "sender_type": m.sender_type.value,
                    "content": m.content,
                    "created_at": str(m.created_at),
                }
                for m in msgs
            ],
            "last_intent": last_intent,
        }

    def _to_conversation_summary(self, conv) -> dict:
        msgs = self.chat_repo.get_messages(conv.id)
        last_msg = msgs[-1] if msgs else None
        return {
            "id": conv.id,
            "user_id": conv.user_id,
            "username": conv.user.username if conv.user else None,
            "status": conv.status.value,
            "message_count": len(msgs),
            "last_message": last_msg.content[:80] if last_msg else None,
            "updated_at": str(conv.updated_at),
        }
