from typing import List
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import ChatMessageModel
from app.domain.entities.chat_message import ChatMessage 


class ChatRepositorySQL:
    def __init__(self, session_factory: sessionmaker = SessionLocal):
        self._session_factory = session_factory

    def add_message(self, message: ChatMessage) -> ChatMessage:
        with self._session_factory() as session:
            db_msg = ChatMessageModel(
                user_id=message.user_id,
                role=message.role,
                content=message.content,
                timestamp=message.timestamp or datetime.utcnow(),
            )
            session.add(db_msg)
            session.commit()
            session.refresh(db_msg)

            message.id = db_msg.id
            return message

    def get_last_messages(self, user_id: int, limit: int = 20) -> List[ChatMessage]:
        """
        Возвращает последние N сообщений пользователя (user + FinPulse),
        отсортированные по времени.
        """
        with self._session_factory() as session:
            rows = (
                session.query(ChatMessageModel)
                .filter_by(user_id=user_id)
                .order_by(ChatMessageModel.timestamp.desc())
                .limit(limit)
                .all()
            )

            rows = list(reversed(rows))

            return [
                ChatMessage(
                    id=row.id,
                    user_id=row.user_id,
                    role=row.role,
                    content=row.content,
                    timestamp=row.timestamp,
                )
                for row in rows
            ]
