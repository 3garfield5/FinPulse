import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.infrastructure.database.base import Base, engine
from app.infrastructure.database.seed_rbac import seed_rbac
from app.infrastructure.middleware import ErrorHandlingMiddleware, LoggingMiddleware
from app.presentation.api.admin_users import router as admin_users_router
from app.presentation.api.auth import router as auth_router
from app.presentation.api.chat import router as chat_router
from app.presentation.api.me import router as me_router
from app.presentation.api.meta import router as options_router
from app.presentation.api.profile import router as profile_router
from app.presentation.api.summary import router as summary_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="FinPulse API", version="1.0")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_rbac(admin_email=getattr(settings, "ADMIN_EMAIL", None))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

app.add_middleware(ErrorHandlingMiddleware)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(summary_router)
app.include_router(profile_router)
app.include_router(options_router)
app.include_router(me_router)
app.include_router(admin_users_router)


@app.get("/")
def root():
    return {"message": "Welcome to FinPulse API"}
