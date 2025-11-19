from fastapi import APIRouter, Depends

from app.infrastructure.security.auth_jwt import get_current_user
from app.domain.entities.user import User
from app.presentation.schemas.users import UserOut

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    """
    Возвращает профиль текущего авторизованного пользователя.
    Токен берётся из заголовка Authorization: Bearer <token>.
    """
    return current_user
