# domain/services/llm_service.py
from abc import ABC, abstractmethod

class ILLMService(ABC):
    @abstractmethod
    def chat(self, prompt: str, user_context: dict) -> str: ...
    @abstractmethod
    def summarize(self, text: str) -> str: ...
