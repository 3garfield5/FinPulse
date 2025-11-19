import datetime
from app.application.interfaces.llm import ILLMService
from app.application.use_cases.chat.build_prompt import build_chat_context
from app.domain.entities.chat_message import ChatMessage
from app.infrastructure.database.chat_repo_impl import ChatRepositorySQL


class ChatWithLLM:
    def __init__(self, llm: ILLMService, chat_repo: ChatRepositorySQL):
        self.llm = llm
        self.chat_repo = chat_repo

    def execute(self, user_id: int, user_message: str) -> str:
        self.chat_repo.add_message(ChatMessage(
            id=None,
            user_id=user_id,
            role="user",
            content=user_message,
            timestamp=datetime.datetime.utcnow(),
        ))

        history = self.chat_repo.get_last_messages(user_id=user_id, limit=50)

        prompt = build_chat_context(history)

        response_text = self.llm.chat(
            prompt=prompt,
            user_context={"user_id": user_id}
        )

        self.chat_repo.add_message(ChatMessage(
            id=None,
            user_id=user_id,
            role="FinPulse",
            content=response_text,
            timestamp=datetime.datetime.utcnow(),
        ))

        return response_text
