from typing import List
from pydantic import BaseModel

from app.presentation.schemas.auth import CategoryEnum, MarketEnum

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    markets: List[MarketEnum]
    categories: List[CategoryEnum]

    class Config:
        orm_mode = True
