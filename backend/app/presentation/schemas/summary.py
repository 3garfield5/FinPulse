# app/presentation/schemas/news.py

from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel

Impact = Literal["positive", "neutral", "negative"]
Confidence = Literal["low", "medium", "high"]


class NewsIndicatorOut(BaseModel):
    impact: Impact
    confidence: Confidence
    rationale: List[str]


class NewsBlockOut(BaseModel):
    title: str
    source: str
    url: str

    summary: str

    bullets: List[str] = []
    conclusion: Optional[str] = None
    risks: List[str] = []

    indicator: Optional[NewsIndicatorOut] = None

    asof: Optional[date] = None

    class Config:
        from_attributes = True
