from pydantic import BaseModel


class NewsBlockOut(BaseModel):
    title: str
    source: str
    url: str
    summary: str
