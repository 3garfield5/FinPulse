from enum import Enum
from typing import List

from pydantic import BaseModel, EmailStr, constr


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
        schema_extra = {
            "example": {
                "name": "Matvey",
                "email": "mat@example.com",
                "password": "123456",
                "markets": ["russia", "usa"],
                "categories": ["macro", "crypto"],
            },
            "description": """
                Доступные рынки:
                - russia → Россия
                - usa → США
                - europe → Европа
                - asia → Азия
                """,
        }


class LoginIn(BaseModel):
    email: EmailStr
    password: constr(min_length=6)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
