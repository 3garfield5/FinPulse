from dataclasses import dataclass
from typing import List


@dataclass
class User:
    id: int | None
    name: str
    email: str
    password_hash: str
    markets: List[str]
    categories: List[str]
