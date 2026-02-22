from abc import ABC, abstractmethod
from typing import Optional


class ILLMService(ABC):
    @abstractmethod
    def chat(self, prompt: str, user_context: Optional[dict] = None) -> str: ...
