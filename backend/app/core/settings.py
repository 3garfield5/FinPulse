from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_EXPIRE_MINUTES: int
    REFRESH_EXPIRE_DAYS: int

    LLM_PROVIDER: str
    OLLAMA_URL: str
    OLLAMA_MODEL: str
    OLLAMA_MAX_CONCURRENCY: int = Field(default=1, ge=1, le=8)

    ADMIN_EMAIL: str

    S3_PUBLIC_ENDPOINT: str
    S3_ENDPOINT: str
    S3_REGION: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_PRESIGN_EXPIRES_SEC: int


settings = Settings()
