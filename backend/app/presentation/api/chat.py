from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.application.use_cases.chat.chat_with_llm import ChatWithLLM
from app.domain.entities.user import User
from app.infrastructure.database.chat_repo_impl import ChatRepositorySQL
from app.infrastructure.database.chat_session_repo_impl import ChatSessionRepositorySQL
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.dependencies import get_chat_repo, get_chat_session_repo, get_chat_use_case, get_user_repo
from app.infrastructure.security.auth_jwt import get_current_user
from app.infrastructure.security.authz import require_permissions
from app.presentation.schemas.chat import ChatCreateIn, ChatIn, ChatMessageOut, ChatOut, ChatSessionOut

router = APIRouter(prefix="/chat", tags=["Chat"])


def _can_multi(roles: set[str]) -> bool:
    return "admin" in roles or "pro" in roles


@router.post("/send", response_model=ChatOut, dependencies=[Depends(require_permissions(["chat:use"]))])
def send_message(
    body: ChatIn,
    current_user: User = Depends(get_current_user),
    use_case: ChatWithLLM = Depends(get_chat_use_case),
    chat_session_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
):
    roles = user_repo.get_roles(current_user.id)

    if not _can_multi(roles):
        effective_chat_id = chat_session_repo.get_or_create_default(current_user.id).id
    else:
        if body.chat_id is None:
            effective_chat_id = chat_session_repo.get_or_create_default(current_user.id).id
        else:
            chat_session_repo.ensure_owner(chat_id=body.chat_id, user_id=current_user.id)
            effective_chat_id = body.chat_id

    answer = use_case.execute(user_id=current_user.id, user_message=body.message, chat_id=effective_chat_id)
    return ChatOut(answer=answer, chat_id=effective_chat_id)


@router.get(
    "/history", response_model=List[ChatMessageOut], dependencies=[Depends(require_permissions(["chat:history_read"]))]
)
def get_history(
    limit: int = 50,
    chat_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    repo: ChatRepositorySQL = Depends(get_chat_repo),
    chat_session_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
):
    roles = user_repo.get_roles(current_user.id)

    if not _can_multi(roles):
        effective_chat_id = chat_session_repo.get_or_create_default(current_user.id).id
    else:
        if chat_id is None:
            effective_chat_id = chat_session_repo.get_or_create_default(current_user.id).id
        else:
            chat_session_repo.ensure_owner(chat_id=chat_id, user_id=current_user.id)
            effective_chat_id = chat_id

    messages = repo.get_last_messages(user_id=current_user.id, limit=limit, chat_id=effective_chat_id)
    return [ChatMessageOut(id=m.id, role=m.role, content=m.content, created_at=m.timestamp) for m in messages]


@router.get("", response_model=List[ChatSessionOut], dependencies=[Depends(require_permissions(["chat:use"]))])
def list_chats(
    current_user: User = Depends(get_current_user),
    chat_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
):
    roles = user_repo.get_roles(current_user.id)

    if not _can_multi(roles):
        default = chat_repo.get_or_create_default(current_user.id)
        return [ChatSessionOut(id=default.id, title=default.title, topic=default.topic, is_default=True)]

    chats = chat_repo.list_user_chats(current_user.id)
    if not chats:
        default = chat_repo.get_or_create_default(current_user.id)
        chats = [default]

    return [ChatSessionOut(id=c.id, title=c.title, topic=c.topic, is_default=c.is_default) for c in chats]


@router.post("", response_model=ChatSessionOut, dependencies=[Depends(require_permissions(["chat:use"]))])
def create_chat(
    body: ChatCreateIn,
    current_user: User = Depends(get_current_user),
    chat_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
):
    roles = user_repo.get_roles(current_user.id)
    if not _can_multi(roles):
        raise HTTPException(status_code=403, detail="ONLY_PRO_OR_ADMIN_CAN_CREATE_CHATS")

    chat = chat_repo.create_chat(current_user.id, title=body.title, topic=body.topic)
    return ChatSessionOut(id=chat.id, title=chat.title, topic=chat.topic, is_default=chat.is_default)


@router.delete("/{chat_id}", dependencies=[Depends(require_permissions(["chat:use"]))])
def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    chat_repo: ChatSessionRepositorySQL = Depends(get_chat_session_repo),
):
    try:
        ok = chat_repo.delete_chat(user_id=current_user.id, chat_id=chat_id)
    except ValueError as e:
        if str(e) == "CANNOT_DELETE_DEFAULT_CHAT":
            raise HTTPException(status_code=409, detail="CANNOT_DELETE_DEFAULT_CHAT")
        raise

    if not ok:
        raise HTTPException(status_code=404, detail="CHAT_NOT_FOUND")

    return {"ok": True}
