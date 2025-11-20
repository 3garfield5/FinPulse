# app/presentation/api/news.py
from typing import List

from fastapi import APIRouter, Depends

from app.application.use_cases.summarize_article import GetNewsFeed
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.llm.ollama_llm_service import OllamaLLMService
from app.infrastructure.llm.scraper_service import ScraperService
from app.infrastructure.security.auth_jwt import get_current_user
from app.presentation.api.chat import get_llm_service
from app.presentation.schemas.summary import NewsBlockOut

router = APIRouter(prefix="/news", tags=["News"])


@router.get("/feed", response_model=List[NewsBlockOut])
def get_personal_news_feed(
    current_user=Depends(get_current_user),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
    llm: OllamaLLMService = Depends(get_llm_service),
):
    user = user_repo.get_by_email(current_user.email)
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="User not found")

    scraper = ScraperService()
    use_case = GetNewsFeed(scraper=scraper, llm=llm)

    blocks = use_case.execute(user)

    return [
        NewsBlockOut(
            title=b.title,
            source=b.source,
            url=b.url,
            summary=b.summary,
        )
        for b in blocks
    ]
