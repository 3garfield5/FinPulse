# domain/repositories/user_repository.py
from abc import ABC, abstractmethod
from app.domain.entities.user import User

class IUserRepository(ABC):
    @abstractmethod
    def create(self, user: User) -> User: ...

    @abstractmethod
    def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    def delete(self, id: int) -> None: ...
