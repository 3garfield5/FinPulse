from fastapi import APIRouter, Depends
from app.application.use_cases.chat_with_llm import ChatWithLLM
from app.infrastructure.external.llm_openai_service import OpenAILLMService
from app.infrastructure.security.auth_jwt import get_current_user
from app.domain.entities.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/")
def chat_with_ai(message: str, current_user: User = Depends(get_current_user)):
    llm = OpenAILLMService(api_key="OPENAI_KEY")
    use_case = ChatWithLLM(llm)
    response = use_case.execute(user_id=current_user.id, message=message)
    return {"user": current_user.email, "response": response}
