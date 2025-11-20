# app/application/use_cases/get_news_feed.py
from typing import List
from urllib.parse import urlparse

from app.application.interfaces.llm import ILLMService
from app.core.constants import NEWS_SOURCES
from app.domain.entities.news_block import NewsBlock
from app.domain.entities.user import User
from app.infrastructure.llm.scraper_service import ScraperService


class GetNewsFeed:
    """
    Собирает 3 блока новостей под предпочтения пользователя.
    """

    def __init__(
        self,
        scraper: ScraperService,
        llm: ILLMService,
    ):
        self.scraper = scraper
        self.llm = llm

    def _pick_sources(self, user: User, max_blocks: int = 3) -> list[tuple[str, str, str]]:
        """
        Возвращает список (market, category, url) длиной до max_blocks
        исходя из user.markets и user.categories.
        """
        markets = user.markets or []
        categories = user.categories or []

        picked: list[tuple[str, str, str]] = []

        for market in markets:
            market_sources = NEWS_SOURCES.get(market, {})
            for category in categories:
                urls = market_sources.get(category, [])
                for url in urls:
                    picked.append((market, category, url))
                    if len(picked) >= max_blocks:
                        return picked

        return picked[:max_blocks]

    def execute(self, user: User) -> List[NewsBlock]:
        """
        Основной сценарий:
        1. Выбираем до 3 источников по предпочтениям.
        2. Тянем текст со страницы (просто как длинную статью/лента).
        3. LLM делает краткий обзор.
        """
        blocks: List[NewsBlock] = []

        sources = self._pick_sources(user, max_blocks=3)
        if not sources:
            return []

        for market, category, url in sources:
            raw_text = self.scraper.fetch_article_text(url)

            prompt = (
                "Сделай краткий обзор ключевых новостей с этой страницы. "
                "Структура: 3–5 пунктов с тезисами, потом короткий вывод. "
                "Пиши по-русски, ориентируйся на частного инвестора.\n\n"
                f"Текст страницы:\n{raw_text}"
            )

            summary = self.llm.summarize(prompt)

            parsed = urlparse(url)
            source_name = parsed.netloc or url

            title = f"{market.capitalize()} / {category.capitalize()} — обзор новостей"

            blocks.append(
                NewsBlock(
                    title=title,
                    source=source_name,
                    url=url,
                    summary=summary,
                )
            )

        return blocks
