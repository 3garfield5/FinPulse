from fastapi import APIRouter, Depends, HTTPException

from app.core.files_rules import MAX_SIZE_BYTES, is_allowed_mime
from app.core.settings import settings
from app.domain.entities.user import User
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.chat_session_repo_impl import ChatSessionRepositorySQL
from app.infrastructure.database.file_repo_impl import FileRepositorySQL
from app.infrastructure.database.models import FileModel
from app.infrastructure.dependencies import get_chat_session_repo, get_file_repo
from app.infrastructure.s3.client import get_s3_client
from app.infrastructure.security.auth_jwt import get_current_user
from app.infrastructure.security.authz import require_permissions
from app.presentation.schemas.files import CompleteIn, DownloadUrlOut, FileOut, InitUploadIn, InitUploadOut

router = APIRouter(prefix="/files", tags=["Files"])


def _build_object_key(owner_id: int, chat_id: int, file_id: int, original_name: str) -> str:
    return f"users/{owner_id}/chats/{chat_id}/files/{file_id}"


@router.post(
    "/init-upload", response_model=InitUploadOut, dependencies=[Depends(require_permissions(["chat:attach_files"]))]
)
def init_upload(
    body: InitUploadIn,
    current_user: User = Depends(get_current_user),
    chat_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    file_repo: FileRepositorySQL = Depends(get_file_repo),
):
    chat_repo.ensure_owner(chat_id=body.chat_id, user_id=current_user.id)

    if not is_allowed_mime(body.mime_type):
        raise HTTPException(status_code=422, detail="UNSUPPORTED_MIME_TYPE")
    if body.size_bytes > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="FILE_TOO_LARGE")

    tmp_key = "tmp"
    pending = file_repo.create_pending(
        owner_id=current_user.id,
        chat_id=body.chat_id,
        original_name=body.original_name,
        mime_type=body.mime_type,
        size_bytes=body.size_bytes,
        object_key=tmp_key,
    )

    object_key = _build_object_key(current_user.id, body.chat_id, pending.id, body.original_name)

    with SessionLocal() as session:
        f = session.query(FileModel).filter(FileModel.id == pending.id).first()
        f.object_key = object_key
        session.commit()

    s3 = get_s3_client(public=True)

    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.S3_BUCKET,
            "Key": object_key,
        },
        ExpiresIn=getattr(settings, "S3_PRESIGN_EXPIRES_SEC", 300),
    )
    return InitUploadOut(file_id=pending.id, upload_url=upload_url, object_key=object_key)


@router.post(
    "/{file_id}/complete", response_model=FileOut, dependencies=[Depends(require_permissions(["chat:attach_files"]))]
)
def complete_upload(
    file_id: int,
    body: CompleteIn,
    current_user: User = Depends(get_current_user),
    file_repo: FileRepositorySQL = Depends(get_file_repo),
):
    f = file_repo.get_owned(file_id=file_id, owner_id=current_user.id)
    if not f:
        raise HTTPException(status_code=404, detail="FILE_NOT_FOUND")

    s3 = get_s3_client(public=False)
    try:
        head = s3.head_object(Bucket=settings.S3_BUCKET, Key=f.object_key)
    except Exception:
        raise HTTPException(status_code=409, detail="S3_OBJECT_NOT_FOUND")

    content_len = int(head.get("ContentLength") or 0)
    if f.size_bytes and content_len and content_len != f.size_bytes:
        raise HTTPException(status_code=409, detail="SIZE_MISMATCH")

    f2 = file_repo.mark_ready(file_id=file_id)
    return FileOut(
        id=f2.id,
        original_name=f2.original_name,
        mime_type=f2.mime_type,
        size_bytes=f2.size_bytes,
        is_ready=f2.is_ready,
    )


@router.get(
    "/by-chat/{chat_id}",
    response_model=list[FileOut],
    dependencies=[Depends(require_permissions(["chat:attach_files"]))],
)
def list_files(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    chat_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    file_repo: FileRepositorySQL = Depends(get_file_repo),
):
    chat_repo.ensure_owner(chat_id=chat_id, user_id=current_user.id)
    items = file_repo.list_by_chat(chat_id=chat_id, owner_id=current_user.id)
    return [
        FileOut(
            id=f.id,
            original_name=f.original_name,
            mime_type=f.mime_type,
            size_bytes=f.size_bytes,
            is_ready=f.is_ready,
        )
        for f in items
    ]


@router.get(
    "/{file_id}/download-url",
    response_model=DownloadUrlOut,
    dependencies=[Depends(require_permissions(["chat:attach_files"]))],
)
def get_download_url(
    file_id: int,
    current_user: User = Depends(get_current_user),
    file_repo: FileRepositorySQL = Depends(get_file_repo),
):
    f = file_repo.get_owned(file_id=file_id, owner_id=current_user.id)
    if not f:
        raise HTTPException(status_code=404, detail="FILE_NOT_FOUND")
    if not f.is_ready:
        raise HTTPException(status_code=409, detail="FILE_NOT_READY")

    s3 = get_s3_client(public=True)
    url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": f.object_key},
        ExpiresIn=getattr(settings, "S3_PRESIGN_EXPIRES_SEC", 300),
    )
    return DownloadUrlOut(download_url=url)


@router.delete("/{file_id}", dependencies=[Depends(require_permissions(["chat:attach_files"]))])
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    file_repo: FileRepositorySQL = Depends(get_file_repo),
):
    f = file_repo.get_owned(file_id=file_id, owner_id=current_user.id)
    if not f:
        raise HTTPException(status_code=404, detail="FILE_NOT_FOUND")

    s3 = get_s3_client(public=False)
    try:
        s3.delete_object(Bucket=settings.S3_BUCKET, Key=f.object_key)
    except Exception:
        pass

    file_repo.delete_owned(file_id=file_id, owner_id=current_user.id)
    return {"ok": True}
