from hashlib import sha256

from app.application.interfaces.user import IUserRepository
from app.domain.entities.user import User
from app.core.constants import MARKET_RU


class Register:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def execute(
        self,
        name: str,
        email: str,
        password: str,
    ) -> User:
        if self.repo.get_by_email(email):
            raise ValueError("User already exists")

        password_hash = sha256(password.encode()).hexdigest()

        user = User(
            id=None,
            name=name,
            email=email,
            password_hash=password_hash,

            market=MARKET_RU,

            investment_horizon=None,
            experience_level=None,
            risk_level=None,
            tickers=[],
            sectors=[],
        )

        return self.repo.create(user)
