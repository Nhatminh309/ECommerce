from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional, List

from app.models.chat import ChatConversation, ChatMessage, SenderType, ConversationStatus


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_conversation(self, user_id: int) -> ChatConversation:
        """Find the latest open/pending conversation for the user, or create a new one."""
        stmt = (
            select(ChatConversation)
            .where(
                ChatConversation.user_id == user_id,
                ChatConversation.status != ConversationStatus.CLOSED,
            )
            .order_by(ChatConversation.created_at.desc())
        )
        conv = self.db.execute(stmt).scalar_one_or_none()
        if not conv:
            conv = ChatConversation(user_id=user_id, status=ConversationStatus.OPEN)
            self.db.add(conv)
            self.db.commit()
            self.db.refresh(conv)
        return conv

    def get_conversation_by_id(self, conv_id: int) -> Optional[ChatConversation]:
        stmt = select(ChatConversation).where(ChatConversation.id == conv_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all_conversations(self, skip: int = 0, limit: int = 50) -> List[ChatConversation]:
        stmt = (
            select(ChatConversation)
            .order_by(ChatConversation.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def get_conversations_by_user(self, user_id: int) -> List[ChatConversation]:
        stmt = (
            select(ChatConversation)
            .where(ChatConversation.user_id == user_id)
            .order_by(ChatConversation.created_at.desc())
        )
        return self.db.execute(stmt).scalars().all()

    def add_message(
        self, conversation_id: int, sender_type: SenderType, content: str
    ) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            sender_type=sender_type,
            content=content,
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def update_conversation_status(
        self, conv: ChatConversation, status: ConversationStatus
    ) -> ChatConversation:
        conv.status = status
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def get_messages(self, conversation_id: int) -> List[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at)
        )
        return self.db.execute(stmt).scalars().all()
