from pydantic import BaseModel


class ArticleUrlIn(BaseModel):
    url: str


class ArticleSummaryOut(BaseModel):
    text: str
    summary: str
