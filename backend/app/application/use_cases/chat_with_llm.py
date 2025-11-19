# application/use_cases/chat_with_llm.py
from app.application.interfaces.llm import ILLMService

class ChatWithLLM:
    def __init__(self, llm: ILLMService):
        self.llm = llm

    def execute(self, user_id: int, message: str) -> str:
        response = self.llm.chat(prompt=message, user_context={"user_id": user_id})
        return response
