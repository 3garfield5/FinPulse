# app/infrastructure/database/user_repo_impl.py
from app.domain.repositories.user_repository import IUserRepository
from app.domain.entities.user import User
from hashlib import sha256

# Временная "фейковая база данных" — просто словарь в памяти
_fake_users_db = {}


class UserRepositorySQL(IUserRepository):
    def create(self, user: User) -> User:
        """Создаёт пользователя в памяти"""
        user.id = len(_fake_users_db) + 1
        _fake_users_db[user.email] = user
        return user

    def get_by_email(self, email: str) -> User | None:
        """Возвращает пользователя по email"""
        return _fake_users_db.get(email)
