from datetime import datetime
from typing import Optional

from sqlalchemy.orm import sessionmaker

from app.application.interfaces.user import IUserRepository
from app.domain.entities.user import User
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import UserModel


class UserRepositorySQL(IUserRepository):
    def __init__(self, session_factory: sessionmaker = SessionLocal):
        self._session_factory = session_factory

    def create(self, user: User) -> User:
        with self._session_factory() as session:
            existing = session.query(UserModel).filter_by(email=user.email).first()
            if existing:
                raise ValueError("Пользователь с таким email уже существует")

            db_user = UserModel(
                name=user.name,
                email=user.email,
                password_hash=user.password_hash,
                markets=user.markets,
                categories=user.categories,
            )

            session.add(db_user)
            session.commit()
            session.refresh(db_user)

            user.id = db_user.id
            return user

    def get_by_email(self, email: str) -> Optional[User]:
        with self._session_factory() as session:
            db_user = session.query(UserModel).filter_by(email=email).first()
            if db_user is None:
                return None

            return User(
                id=db_user.id,
                name=db_user.name,
                email=db_user.email,
                password_hash=db_user.password_hash,
                markets=db_user.markets,
                categories=db_user.categories,
            )

    def delete(self, id: int) -> bool:
        with self._session_factory() as session:
            db_user = session.query(UserModel).filter_by(id=id).first()
            if db_user is None:
                return False

            session.delete(db_user)
            session.commit()

            return True

    def update(self, user: User) -> User:
        with self._session_factory() as session:
            db_user = session.query(UserModel).filter_by(id=user.id).first()
            if not db_user:
                raise ValueError("User not found")

            db_user.name = user.name
            db_user.email = user.email
            db_user.password_hash = user.password_hash
            db_user.markets = user.markets
            db_user.categories = user.categories

            session.commit()
            session.refresh(db_user)
            return user

    def get_by_id(self, id: int) -> Optional[User]:
        with self._session_factory() as session:
            db_user = session.query(UserModel).filter_by(id=id).first()
            if db_user is None:
                return None

            return User(
                id=db_user.id,
                name=db_user.name,
                email=db_user.email,
                password_hash=db_user.password_hash,
                markets=db_user.markets,
                categories=db_user.categories,
            )
        
    def update_refresh_token(self, user_id: int, refresh_token: str | None, expires_at: datetime | None):
        with self._session_factory() as session:
            user = session.query(UserModel).get(user_id)
            if not user:
                return
            user.refresh_token = refresh_token
            user.refresh_token_expires_at = expires_at
            session.commit()

    def get_by_refresh_token(self, refresh_token: str) -> UserModel | None:
        with self._session_factory() as session:
            return (
                session.query(UserModel)
                .filter(UserModel.refresh_token == refresh_token)
                .first()
        )

