from fastapi import APIRouter, Depends, HTTPException, status

from app.application.interfaces.user import IUserRepository
from app.core.constants import ALLOWED_CATEGORIES, ALLOWED_MARKETS
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.security.auth_jwt import get_current_user
from app.presentation.schemas.profile import PreferencesUpdate
from app.presentation.schemas.users import UserOut

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.patch("/preferences", response_model=UserOut)
def update_preferences(
    data: PreferencesUpdate,
    current_user=Depends(get_current_user),
    user_repo: IUserRepository = Depends(get_user_repo),
):
    user = user_repo.get_by_email(current_user.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if data.markets is not None:
        invalid = set(data.markets) - set(ALLOWED_MARKETS)
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимые рынки: {', '.join(invalid)}",
            )
        user.markets = data.markets

    if data.categories is not None:
        invalid = set(data.categories) - set(ALLOWED_CATEGORIES)
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Недопустимые категории: {', '.join(invalid)}",
            )
        user.categories = data.categories

    user_repo.update(user)

    return user


@router.get("", response_model=UserOut)
def profile(
    current_user=Depends(get_current_user),
):
    return current_user
