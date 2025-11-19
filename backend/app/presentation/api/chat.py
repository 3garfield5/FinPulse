from fastapi import APIRouter, Depends

from app.infrastructure.security.auth_jwt import get_current_user
from app.domain.entities.user import User
from app.infrastructure.llm.ollama_llm_service import OllamaLLMService
from app.infrastructure.database.chat_repo_impl import ChatRepositorySQL
from app.application.use_cases.chat.chat_with_llm import ChatWithLLM
from app.core.settings import settings
from app.presentation.schemas.chat import ChatIn, ChatOut

router = APIRouter(prefix="/chat", tags=["Chat"])

def get_llm_service() -> OllamaLLMService:
    return OllamaLLMService(model=settings.LLM)

def get_chat_repo() -> ChatRepositorySQL:
    return ChatRepositorySQL()

def get_chat_use_case(
    llm: OllamaLLMService = Depends(get_llm_service),
    repo: ChatRepositorySQL = Depends(get_chat_repo),
) -> ChatWithLLM:
    return ChatWithLLM(llm=llm, chat_repo=repo)


@router.post("/send", response_model=ChatOut)
def send_message(
    body: ChatIn,
    current_user: User = Depends(get_current_user),
    use_case: ChatWithLLM = Depends(get_chat_use_case),
):
    answer = use_case.execute(user_id=current_user.id, user_message=body.message)
    return ChatOut(answer=answer)
