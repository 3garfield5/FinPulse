from enum import Enum
from typing import List

from pydantic import BaseModel, EmailStr, constr, field_validator

from app.core.constants import ALLOWED_CATEGORIES, ALLOWED_MARKETS


class MarketEnum(str, Enum):
    russia = "russia"
    usa = "usa"
    europe = "europe"
    asia = "asia"


class CategoryEnum(str, Enum):
    macro = "macro"  # Макроэкономика
    stocks = "stocks"  # Акции
    fx = "fx"  # Валюта
    crypto = "crypto"  # Криптовалюта
    commodities = "commodities"  # Сырьевой товар


class RegisterIn(BaseModel):
    name: constr(min_length=2, max_length=50)
    email: EmailStr
    password: constr(min_length=6)
    markets: List[MarketEnum]
    categories: List[CategoryEnum]

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Matvey",
                "email": "mat@example.com",
                "password": "123456",
                "markets": ["russia", "usa"],
                "categories": ["macro", "crypto"],
            },
        }

    @field_validator("markets")
    @classmethod
    def validate_markets(cls, v: list[str]) -> list[str]:
        unknown = set(v) - set(ALLOWED_MARKETS)
        if unknown:
            raise ValueError(f"Неизвестные рынки: {', '.join(unknown)}. " f"Допустимые: {', '.join(ALLOWED_MARKETS)}")
        return v

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, v: list[str]) -> list[str]:
        unknown = set(v) - set(ALLOWED_CATEGORIES)
        if unknown:
            raise ValueError(
                f"Неизвестные категории: {', '.join(unknown)}. " f"Допустимые: {', '.join(ALLOWED_CATEGORIES)}"
            )
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

class RefreshIn(BaseModel):
    refresh_token: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
