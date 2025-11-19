from hashlib import sha256
from typing import List

from app.application.interfaces.user import IUserRepository
from app.domain.entities.user import User
from app.presentation.schemas.auth import CategoryEnum, MarketEnum


class Register:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def execute(
        self,
        name: str,
        email: str,
        password: str,
        markets: List[MarketEnum],
        categories: List[CategoryEnum],
    ) -> User:
        if self.repo.get_by_email(email):
            raise ValueError("User already exists")

        password_hash = sha256(password.encode()).hexdigest()

        return self.repo.create(
            User(
                id=None,
                name=name,
                email=email,
                password_hash=password_hash,
                markets=[m.value for m in markets],
                categories=[c.value for c in categories],
            )
        )
