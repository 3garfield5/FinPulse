import logging
import threading
from typing import List, Optional
from app.presentation.schemas.summary import NewsBlockOut
from app.infrastructure.database.news_repo_impl import NewsRepositorySQL
from app.application.use_cases.summarize_article import GetNewsFeed
from app.domain.entities.user import User

logger = logging.getLogger(__name__)
_PUBLIC_REFRESH_LOCK = threading.Lock()


class GetPublicNewsFeed:
    def __init__(self, repo: NewsRepositorySQL, generator: GetNewsFeed):
        self.repo = repo
        self.generator = generator

    def execute(self, limit: int = 50, force: bool = False) -> List[NewsBlockOut]:
        items = self.repo.list_public(limit=limit)

        if force:
            self._refresh_public(force=True)
            items = self.repo.list_public(limit=limit)
            return [self.repo.to_news_block_out(i) for i in items]

        # Cold start: если данных нет, делаем синхронное наполнение один раз.
        if not items:
            self._refresh_public(force=False)
            items = self.repo.list_public(limit=limit)
            return [self.repo.to_news_block_out(i) for i in items]

        # Stale-while-revalidate: отдаём витрину мгновенно, обновляем в фоне.
        self._refresh_public_in_background()
        return [self.repo.to_news_block_out(i) for i in items]

    def _refresh_public(self, *, force: bool) -> None:
        public_user = User(
            id=0,
            name="Public",
            email="public@finpulse.local",
            password_hash="",
        )
        self.generator.execute(public_user, force=force, audience="public")

    def _refresh_public_in_background(self) -> None:
        if not _PUBLIC_REFRESH_LOCK.acquire(blocking=False):
            return

        def _runner() -> None:
            try:
                self._refresh_public(force=False)
            except Exception as e:
                logger.warning("Background public news refresh failed: %s", e)
            finally:
                _PUBLIC_REFRESH_LOCK.release()

        thread = threading.Thread(target=_runner, name="public-news-refresh", daemon=True)
        thread.start()


class GetPublicNewsItem:
    def __init__(self, repo: NewsRepositorySQL):
        self.repo = repo

    def execute(self, news_id: int) -> Optional[NewsBlockOut]:
        i = self.repo.get_public_by_id(news_id)
        if not i:
            return None
        return self.repo.to_news_block_out(i)


class GetPublicNewsItemBySlug:
    def __init__(self, repo: NewsRepositorySQL):
        self.repo = repo

    def execute(self, slug: str) -> Optional[NewsBlockOut]:
        i = self.repo.get_public_by_slug(slug=slug)
        if not i:
            return None
        return self.repo.to_news_block_out(i)
