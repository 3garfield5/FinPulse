from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict

from app.core.constants import MARKET_RU


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    market: Literal["RU"] = MARKET_RU

    investment_horizon: Optional[Literal["short", "mid", "long"]] = None
    experience_level: Optional[Literal["beginner", "intermediate", "pro"]] = None
    risk_level: Optional[Literal["low", "medium", "high"]] = None

    tickers: List[str] = []
    sectors: List[str] = []

    model_config = ConfigDict(from_attributes=True)
