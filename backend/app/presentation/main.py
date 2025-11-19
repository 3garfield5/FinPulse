from fastapi import FastAPI
from app.presentation.api.auth import router as auth_router
from app.presentation.api.chat import router as chat_router
from app.presentation.api.summary import router as summary_router
from app.presentation.api.profile import router as profile_router

app = FastAPI(title="FinPulse API", version="1.0")

# Подключаем все маршруты
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(summary_router)
app.include_router(profile_router)

@app.get("/")
def root():
    return {"message": "Welcome to FinPulse API"}
