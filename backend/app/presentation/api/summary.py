from datetime import datetime, timedelta
from typing import List, Dict, Tuple

from fastapi import APIRouter, Depends, HTTPException

from app.application.use_cases.summarize_article import GetNewsFeed
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.llm.ollama_llm_service import OllamaLLMService
from app.infrastructure.llm.scraper_service import ScraperService
from app.infrastructure.security.auth_jwt import get_current_user
from app.presentation.api.chat import get_llm_service
from app.presentation.schemas.summary import NewsBlockOut

router = APIRouter(prefix="/news", tags=["News"])

CACHE_TTL = timedelta(minutes=10)

_news_cache: Dict[int, Tuple[datetime, List[NewsBlockOut]]] = {}


@router.get("/feed", response_model=List[NewsBlockOut])
def get_personal_news_feed(
    current_user=Depends(get_current_user),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
    llm: OllamaLLMService = Depends(get_llm_service),
):
    user = user_repo.get_by_email(current_user.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.utcnow()

    cached = _news_cache.get(user.id)
    if cached is not None:
        ts, blocks = cached
        if now - ts < CACHE_TTL:
            return blocks

    scraper = ScraperService()
    use_case = GetNewsFeed(scraper=scraper, llm=llm)

    domain_blocks = use_case.execute(user)

    blocks: List[NewsBlockOut] = [
        NewsBlockOut(
            title=b.title,
            source=b.source,
            url=b.url,
            summary=b.summary,
        )
        for b in domain_blocks
    ]

    _news_cache[user.id] = (now, blocks)

    return blocks
