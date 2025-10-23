from dataclasses import dataclass
from datetime import datetime

@dataclass
class ArticleSummary:
    id: int | None
    url: str
    summary: str
    created_at: datetime
