from fastapi import APIRouter, Depends, HTTPException, status

from app.application.interfaces.user import IUserRepository
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.security.auth_jwt import get_current_user
from app.presentation.schemas.profile import ProfileUpdate
from app.presentation.schemas.users import UserOut

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.patch("", response_model=UserOut)
def update_profile(
    data: ProfileUpdate,
    current_user=Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    """
    Обновление инвестиционного профиля пользователя (MVP).
    Рынок фиксированный: RU.
    """
    user = user_repo.get_by_email(current_user.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Обновляем только те поля, которые пришли (PATCH semantics)
    payload = data.model_dump(exclude_unset=True, exclude_none=True)

    # market не даём менять даже если пришёл (MVP)
    payload.pop("market", None)

    # Маппинг полей профиля в модель пользователя.
    # Важно: названия полей user.* должны совпадать с тем, что у тебя в ORM-модели.
    if "investment_horizon" in payload:
        user.investment_horizon = payload["investment_horizon"]

    if "experience_level" in payload:
        user.experience_level = payload["experience_level"]

    if "risk_level" in payload:
        user.risk_level = payload["risk_level"]

    if "tickers" in payload:
        user.tickers = payload["tickers"]

    if "sectors" in payload:
        user.sectors = payload["sectors"]

    user_repo.update(user)
    return user


@router.get("", response_model=UserOut)
def profile(current_user=Depends(get_current_user)):
    return current_user
