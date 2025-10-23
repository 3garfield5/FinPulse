from dataclasses import dataclass
from datetime import datetime

@dataclass
class ChatMessage:
    id: int | None
    user_id: int
    role: str  # 'user' | 'assistant'
    content: str
    timestamp: datetime
