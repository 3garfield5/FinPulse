import logging
from app.infrastructure.database.base import Base
from app.infrastructure.database.base import engine


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.infrastructure.middleware import ErrorHandlingMiddleware, LoggingMiddleware
from app.presentation.api.auth import router as auth_router
from app.presentation.api.chat import router as chat_router
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


@app.get("/")
def root():
    return {"message": "Welcome to FinPulse API"}
