from pydantic import BaseModel, Field


class InitUploadIn(BaseModel):
    chat_id: int
    original_name: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=1, max_length=100)
    size_bytes: int = Field(gt=0)


class InitUploadOut(BaseModel):
    file_id: int
    upload_url: str
    object_key: str


class FileOut(BaseModel):
    id: int
    original_name: str
    mime_type: str
    size_bytes: int
    is_ready: bool


class DownloadUrlOut(BaseModel):
    download_url: str


class CompleteIn(BaseModel):
    pass
