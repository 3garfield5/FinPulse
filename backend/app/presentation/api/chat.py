from typing import List

from fastapi import APIRouter, Depends

from app.application.use_cases.chat.chat_with_llm import ChatWithLLM
from app.domain.entities.user import User
from app.infrastructure.database.chat_repo_impl import ChatRepositorySQL
from app.infrastructure.dependencies import get_chat_repo, get_chat_use_case
from app.infrastructure.security.auth_jwt import get_current_user
from app.infrastructure.security.authz import require_permissions
from app.presentation.schemas.chat import ChatIn, ChatMessageOut, ChatOut

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/send", response_model=ChatOut, dependencies=[Depends(require_permissions(["chat:use"]))])
def send_message(
    body: ChatIn,
    current_user: User = Depends(get_current_user),
    use_case: ChatWithLLM = Depends(get_chat_use_case),
):
    answer = use_case.execute(user_id=current_user.id, user_message=body.message)
    return ChatOut(answer=answer)


@router.get(
    "/history", response_model=List[ChatMessageOut], dependencies=[Depends(require_permissions(["chat:history_read"]))]
)
async def get_history(
    limit: int = 50,
    current_user=Depends(get_current_user),
    repo: ChatRepositorySQL = Depends(get_chat_repo),
):
    messages = repo.get_last_messages(user_id=current_user.id, limit=limit)
    return [
        ChatMessageOut(
            id=m.id,
            role=m.role,  # "user" / "FinPulse"
            content=m.content,
            created_at=m.timestamp,
        )
        for m in messages
    ]
