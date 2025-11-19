from fastapi import APIRouter, HTTPException, Depends, status

from app.application.use_cases.register import Register
from app.application.use_cases.login import Login
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.security.auth_jwt import create_access_token
from app.application.interfaces.user import IUserRepository
from app.infrastructure.dependencies import get_user_repo
from app.presentation.schemas.auth import LoginIn, RegisterIn, TokenOut
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
            markets=data.markets,
            categories=data.categories,
        )
        return user

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

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
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": user.email})

    return TokenOut(access_token=token)
