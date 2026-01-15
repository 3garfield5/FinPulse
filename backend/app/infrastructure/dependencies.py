from fastapi import Depends
from app.application.interfaces.user import IUserRepository
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.database.news_cache_repo_impl import NewsCacheRepoSQL
from app.infrastructure.llm.scraper_service import ScraperService
from app.infrastructure.database.chat_repo_impl import ChatRepositorySQL
from app.infrastructure.llm.ollama_llm_service import OllamaLLMService
from app.application.use_cases.chat.chat_with_llm import ChatWithLLM
from app.application.use_cases.summarize_article import GetNewsFeed


def get_user_repo() -> IUserRepository:
    return UserRepositorySQL(SessionLocal)

def get_scraper() -> ScraperService:
    return ScraperService()

def get_news_cache_repo() -> NewsCacheRepoSQL:
    return NewsCacheRepoSQL()

def get_llm_service() -> OllamaLLMService:
    return OllamaLLMService()

def get_chat_repo() -> ChatRepositorySQL:
    return ChatRepositorySQL()

def get_chat_use_case(
    llm: OllamaLLMService = Depends(get_llm_service),
    repo: ChatRepositorySQL = Depends(get_chat_repo),
) -> ChatWithLLM:
    return ChatWithLLM(llm=llm, chat_repo=repo)

def get_news_feed_use_case(
    scraper: ScraperService = Depends(get_scraper),
    llm=Depends(get_llm_service),
    cache_repo: NewsCacheRepoSQL = Depends(get_news_cache_repo),
) -> GetNewsFeed:
    return GetNewsFeed(scraper=scraper, llm=llm, cache_repo=cache_repo)