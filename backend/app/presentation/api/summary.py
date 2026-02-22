from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.use_cases.summarize_article import GetNewsFeed
from app.infrastructure.database.user_repo_impl import UserRepositorySQL
from app.infrastructure.dependencies import get_news_feed_use_case, get_user_repo
from app.infrastructure.security.auth_jwt import get_current_user
from app.infrastructure.security.authz import require_permissions
from app.presentation.schemas.summary import NewsBlockOut, NewsIndicatorOut

router = APIRouter(prefix="/news", tags=["News"])


@router.get("/feed", response_model=List[NewsBlockOut], dependencies=[Depends(require_permissions(["news:list"]))])
def get_personal_news_feed(
    force: bool = False,
    current_user=Depends(get_current_user),
    user_repo: UserRepositorySQL = Depends(get_user_repo),
    use_case: GetNewsFeed = Depends(get_news_feed_use_case),
):
    user = user_repo.get_by_email(current_user.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    blocks = use_case.execute(user, force=force)

    return [
        NewsBlockOut(
            title=b.title,
            source=b.source,
            url=b.url,
            summary=b.summary,
            bullets=b.bullets,
            conclusion=b.conclusion,
            risks=b.risks,
            indicator=(
                NewsIndicatorOut(
                    impact=b.indicator.impact,
                    confidence=b.indicator.confidence,
                    rationale=b.indicator.rationale,
                )
                if b.indicator is not None
                else None
            ),
            asof=b.asof,
        )
        for b in blocks
    ]
