from app.application.interfaces.user import IUserRepository
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.user_repo_impl import UserRepositorySQL


def get_user_repo() -> IUserRepository:
    return UserRepositorySQL(SessionLocal)
