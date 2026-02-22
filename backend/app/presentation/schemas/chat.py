from datetime import datetime

from pydantic import BaseModel


class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    answer: str


class ChatMessageOut(BaseModel):
    id: int
    role: str  # "user" / "assistant"
    content: str
    created_at: datetime
