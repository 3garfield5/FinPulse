# application/use_cases/register_user.py
from app.domain.entities.user import User
from app.domain.repositories.user_repository import IUserRepository
from hashlib import sha256

class RegisterUser:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def execute(self, email: str, password: str) -> User:
        if self.repo.get_by_email(email):
            raise ValueError("User already exists")
        password_hash = sha256(password.encode()).hexdigest()
        return self.repo.create(User(id=None, email=email, password_hash=password_hash))
