from datetime import date
import json
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from dataclasses import dataclass
from app.presentation.schemas.summary import NewsBlockOut, NewsIndicatorOut
from app.infrastructure.database.models import News 
from app.infrastructure.utils import slugify 
from app.infrastructure.database.base import SessionLocal

@dataclass
class NewsRow:
    id: int
    title: str
    slug: str
    source: str
    url: str
    payload_json: str
    asof: Optional[date]
    market: Optional[str]
    category: Optional[str]
    is_public: bool

class NewsRepositorySQL:
    def __init__(self, session_factory: sessionmaker = SessionLocal):
        self._session_factory = session_factory

    def list_public(self, limit: int = 50) -> List[News]:
        with self._session_factory() as session:
            return (
                session.query(News)
                .filter(News.is_public == True)
                .order_by(News.id.desc())
                .limit(limit)
                .all()
            )

    def get_public_by_id(self, news_id: int) -> Optional[News]:
        with self._session_factory() as session:
            return (
                session.query(News)
                .filter(News.id == news_id)
                .filter(News.is_public == True)
                .one_or_none()
            )

    def to_news_block_out(self, b: News) -> NewsBlockOut:
        payload = self._safe_json_loads(b.payload_json)
        summary = str(payload.get("summary") or "").strip()
        bullets = payload.get("facts") or payload.get("bullets") or []
        bullets = [str(x).strip() for x in bullets if str(x).strip()]
        conclusion = payload.get("conclusion")
        conclusion = conclusion.strip() if isinstance(conclusion, str) else None
        risks = payload.get("risks") or []
        risks = [str(x).strip() for x in risks if str(x).strip()]

        indicator_raw = payload.get("indicator") or {}
        indicator = None
        if isinstance(indicator_raw, dict):
            impact = indicator_raw.get("impact")
            confidence = indicator_raw.get("confidence")
            rationale = indicator_raw.get("rationale") or []
            if impact in {"positive", "neutral", "negative"} and confidence in {"low", "medium", "high"}:
                indicator = NewsIndicatorOut(
                    impact=impact,
                    confidence=confidence,
                    rationale=[str(x) for x in rationale if str(x).strip()],
                )

        if not summary:
            summary = "Краткое описание недоступно."

        return NewsBlockOut(
            id=b.id,
            slug=b.slug or slugify(b.title),
            title=b.title,
            source=b.source,
            url=b.url,
            summary=summary,
            bullets=bullets,
            conclusion=conclusion,
            risks=risks,
            indicator=indicator,
            asof=b.asof,
        )
    
    
    def upsert_by_url(
        self,
        *,
        url: str,
        title: str,
        slug: str,
        source: str,
        payload_json: str,
        asof: Optional[date] = None,
        market: Optional[str] = None,
        category: Optional[str] = None,
        is_public: bool = True,
    ) -> NewsRow:
        with self._session_factory() as session:
            row = session.query(News).filter(News.url == url).first()

            if row:
                row.title = title
                row.slug = slug
                row.source = source
                row.payload_json = payload_json
                row.asof = asof
                row.market = market
                row.category = category
                row.is_public = is_public
            else:
                row = News(
                    url=url,
                    title=title,
                    slug=slug,
                    source=source,
                    payload_json=payload_json,
                    asof=asof,
                    market=market,
                    category=category,
                    is_public=is_public,
                )
                session.add(row)

            session.commit()
            session.refresh(row)

        return NewsRow(
            id=row.id,
            title=row.title,
            slug=row.slug,
            source=row.source,
            url=row.url,
            payload_json=row.payload_json,
            asof=row.asof,
            market=row.market,
            category=row.category,
            is_public=row.is_public,
        )

    def get_public_by_slug(self, slug: str) -> Optional[News]:
        with self._session_factory() as session:
            return (
                session.query(News)
                .filter(News.slug == slug)
                .filter(News.is_public == True)
                .order_by(News.id.desc())
                .first()
            )

    @staticmethod
    def _safe_json_loads(s: str) -> dict:
        try:
            payload = json.loads(s or "{}")
            return payload if isinstance(payload, dict) else {}
        except Exception:
            return {}
