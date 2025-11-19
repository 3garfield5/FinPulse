from fastapi import APIRouter, Depends

from app.application.use_cases.summarize_article import SummarizeText
from app.core.settings import settings
from app.infrastructure.llm.ollama_llm_service import OllamaLLMService
from app.infrastructure.llm.scraper_service import ScraperService
from app.presentation.schemas.summary import ArticleSummaryOut, ArticleUrlIn

router = APIRouter(prefix="/summary", tags=["Summary"])


def get_llm_service() -> OllamaLLMService:
    return OllamaLLMService(model=settings.LLM)


def get_summarizer(
    llm: OllamaLLMService = Depends(get_llm_service),
) -> SummarizeText:
    return SummarizeText(llm)


def get_scraper() -> ScraperService:
    return ScraperService()


@router.post("/summary", response_model=ArticleSummaryOut)
def summarize_article(
    body: ArticleUrlIn,
    scraper: ScraperService = Depends(get_scraper),
    summarizer: SummarizeText = Depends(get_summarizer),
):
    article_text = scraper.fetch_article_text(body.url)

    summary = summarizer.execute(article_text)

    return ArticleSummaryOut(text=article_text, summary=summary)
