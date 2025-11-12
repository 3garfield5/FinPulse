# app/application/use_cases/login_user.py
from app.domain.repositories.user_repository import IUserRepository
from hashlib import sha256
from app.domain.entities.user import User


class LoginUser:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def execute(self, email: str, password: str) -> User | None:
        """Проверка email и пароля. Возвращает User или None."""
        user = self.repo.get_by_email(email)
        if not user:
            return None
        
        password_hash = sha256(password.encode()).hexdigest()
        if user.password_hash != password_hash:
            return None

        return user
