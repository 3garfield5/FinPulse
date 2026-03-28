from typing import List, Optional
from app.presentation.schemas.summary import NewsBlockOut
from app.infrastructure.database.news_repo_impl import NewsRepositorySQL
from app.application.use_cases.summarize_article import GetNewsFeed
from app.domain.entities.user import User


class GetPublicNewsFeed:
    def __init__(self, repo: NewsRepositorySQL, generator: GetNewsFeed):
        self.repo = repo
        self.generator = generator

    def execute(self, limit: int = 50, force: bool = False) -> List[NewsBlockOut]:
        # Обновляем публичную витрину в отдельном "public"-режиме (почасовой кэш).
        public_user = User(
            id=0,
            name="Public",
            email="public@finpulse.local",
            password_hash="",
        )
        self.generator.execute(public_user, force=force, audience="public")
        items = self.repo.list_public(limit=limit)
        return [self.repo.to_news_block_out(i) for i in items]


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
