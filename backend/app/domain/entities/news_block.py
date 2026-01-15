# app/domain/entities/news_block.py
from dataclasses import dataclass, field
from datetime import date
from typing import List, Literal, Optional


Impact = Literal["positive", "neutral", "negative"]
Confidence = Literal["low", "medium", "high"]


@dataclass
class NewsIndicator:
    impact: Impact
    confidence: Confidence
    rationale: List[str] = field(default_factory=list)


@dataclass
class NewsBlock:
    title: str
    source: str
    url: str

    summary: str

    bullets: List[str] = field(default_factory=list)
    conclusion: Optional[str] = None
    risks: List[str] = field(default_factory=list)

    indicator: Optional[NewsIndicator] = None

    asof: Optional[date] = None
