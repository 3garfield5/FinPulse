from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt

from app.application.interfaces.user import IUserRepository
from app.application.use_cases.auth.login import Login
from app.application.use_cases.auth.register import Register
from app.core.settings import settings
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.security.auth_jwt import (
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from app.presentation.schemas.auth import LoginIn, RefreshIn, RegisterIn, TokenOut
from app.presentation.schemas.users import UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut)
def register_user(
    data: RegisterIn,
    repo: IUserRepository = Depends(get_user_repo),
):
    use_case = Register(repo)

    try:
        user = use_case.execute(
            name=data.name,
            email=data.email,
            password=data.password,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenOut)
def login_user(
    data: LoginIn,
    repo: IUserRepository = Depends(get_user_repo),
):
    use_case = Login(repo)
    user = use_case.execute(email=data.email, password=data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(user.id, user.email)
    refresh_token, refresh_expires_at = create_refresh_token(user.id, user.email)

    repo.update_refresh_token(
        user_id=user.id,
        refresh_token=refresh_token,
        expires_at=refresh_expires_at,
    )

    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenOut)
def refresh_tokens(
    data: RefreshIn,
    repo: IUserRepository = Depends(get_user_repo),
):
    user = repo.get_by_refresh_token(data.refresh_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if not user.refresh_token_expires_at or user.refresh_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    try:
        jwt.decode(
            data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token(user.email)
    new_refresh_token, new_expires_at = create_refresh_token(user.email)

    repo.update_refresh_token(
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=new_expires_at,
    )

    return TokenOut(
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
def logout_user(
    current_user=Depends(get_current_user),
    repo: IUserRepository = Depends(get_user_repo),
):
    repo.update_refresh_token(
        user_id=current_user.id,
        refresh_token=None,
        expires_at=None,
    )
    return {"detail": "Logged out"}
