from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.application.interfaces.user import IUserRepository
from app.core.settings import settings
from app.infrastructure.dependencies import get_user_repo

bearer_scheme = HTTPBearer()


def _create_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta

    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(email: str):
    return _create_token(
        {"sub": email, "type": "access"},
        timedelta(minutes=settings.ACCESS_EXPIRE_MINUTES),
    )


def create_refresh_token(email: str):
    token = _create_token(
        {"sub": email, "type": "refresh"},
        timedelta(days=settings.REFRESH_EXPIRE_DAYS),
    )
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_EXPIRE_DAYS)
    return token, expires_at



def decode_token(token: str):
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {e}"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    repo: IUserRepository = Depends(get_user_repo),
):
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Not an access token")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = repo.get_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
