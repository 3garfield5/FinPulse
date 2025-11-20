# app/domain/entities/news_block.py
from dataclasses import dataclass


@dataclass
class NewsBlock:
    title: str
    source: str
    url: str
    summary: str
