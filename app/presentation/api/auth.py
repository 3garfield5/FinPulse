# app/presentation/api/auth_router.py
from fastapi import APIRouter, HTTPException, Depends
from app.application.use_cases.register_user import RegisterUser
from app.application.use_cases.login_user import LoginUser
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.security.auth_jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register_user(email: str, password: str):
    repo = UserRepositorySQL()
    use_case = RegisterUser(repo)
    try:
        user = use_case.execute(email, password)
        return {"id": user.id, "email": user.email}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login_user(email: str, password: str):
    repo = UserRepositorySQL()
    use_case = LoginUser(repo)
    user = use_case.execute(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
