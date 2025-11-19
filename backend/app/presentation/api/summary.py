# app/presentation/api/summary_router.py
from fastapi import APIRouter, Depends
from app.application.use_cases.summarize_article import SummarizeArticle
from app.infrastructure.external.llm_openai_service import OpenAILLMService
from app.infrastructure.external.scraper_service import ScraperService
from app.infrastructure.security.auth_jwt import get_current_user
from app.domain.entities.user import User

router = APIRouter(prefix="/summary", tags=["Summary"])

@router.post("/")
def summarize_article(url: str, current_user: User = Depends(get_current_user)):
    # Получаем текст статьи
    scraper = ScraperService()
    article_text = scraper.extract_text(url)

    # Отправляем в LLM для суммаризации
    llm = OpenAILLMService(api_key="OPENAI_KEY")
    use_case = SummarizeArticle(llm)
    summary = use_case.execute(article_text)

    return {"url": url, "summary": summary, "requested_by": current_user.email}
