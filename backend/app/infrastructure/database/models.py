from sqlalchemy import Column, Integer, String, ARRAY
from app.infrastructure.database.base import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    markets = Column(ARRAY(String), nullable=False)
    categories = Column(ARRAY(String), nullable=False)
