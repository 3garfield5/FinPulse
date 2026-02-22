from __future__ import annotations

import json
import re
from datetime import date
from typing import List, Optional
from urllib.parse import urlparse

from app.application.interfaces.llm import ILLMService
from app.core.constants import (
    CATEGORY_MACRO,
    CATEGORY_STOCKS,
    MARKET_RU,
    NEWS_SOURCES,
)
from app.domain.entities.news_block import NewsBlock, NewsIndicator
from app.domain.entities.user import User
from app.infrastructure.database.news_cache_repo_impl import NewsCacheRepoSQL
from app.infrastructure.llm.scraper_service import ScraperService

_WS_RE = re.compile(r"\s+")

_ALLOWED_IMPACT = {"positive", "neutral", "negative"}
_ALLOWED_CONFIDENCE = {"low", "medium", "high"}


def _clean_and_truncate(text: str, max_chars: int = 8000) -> str:
    if not text:
        return ""
    text = _WS_RE.sub(" ", text).strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + " …"


def _safe_json_loads(s: str) -> Optional[dict]:
    try:
        return json.loads(s)
    except Exception:
        return None


def _build_summary_text(bullets: List[str], conclusion: Optional[str], risks: List[str]) -> str:
    parts: List[str] = []
    if bullets:
        parts.append("• " + "\n• ".join(bullets))
    if conclusion:
        parts.append(f"\nВывод: {conclusion}")
    if risks:
        parts.append("\nРиски:\n• " + "\n• ".join(risks))
    return "\n".join(parts).strip()


def _norm_choice(x: Optional[str], allowed: set[str]) -> Optional[str]:
    if not x:
        return None
    x = str(x).strip().lower()
    if x in allowed:
        return x
    if "|" in x:
        return None
    return None


class GetNewsFeed:
    """
    Ежедневный обзор рынка РФ (MVP):
    - raw_text режем
    - base-summary кэшируем в Postgres на день (url+category+date)
    - индикатор impact/confidence (не “совет”)
    """

    def __init__(
        self,
        scraper: ScraperService,
        llm: ILLMService,
        cache_repo: NewsCacheRepoSQL,
    ):
        self.scraper = scraper
        self.llm = llm
        self.cache_repo = cache_repo

    def _pick_sources(self, max_blocks: int = 3) -> list[tuple[str, str, str]]:
        picked: list[tuple[str, str, str]] = []
        market_sources = NEWS_SOURCES.get(MARKET_RU, {})

        macro_urls = market_sources.get(CATEGORY_MACRO, [])
        if macro_urls:
            picked.append((MARKET_RU, CATEGORY_MACRO, macro_urls[0]))

        stocks_urls = market_sources.get(CATEGORY_STOCKS, [])
        for url in stocks_urls:
            if len(picked) >= max_blocks:
                break
            picked.append((MARKET_RU, CATEGORY_STOCKS, url))

        return picked[:max_blocks]

    def _make_base_prompt(self, category: str, raw_text: str) -> str:
        focus = (
            "Фокус: макро РФ (ставки, инфляция, бюджет, санкции, нефть как фактор для РФ, влияние на рынок акций)."
            if category == CATEGORY_MACRO
            else "Фокус: корпоративные новости РФ (отчетности, дивиденды, сделки, регулирование, сектора и крупные эмитенты)."
        )

        return (
            "Ты — аналитик российского фондового рынка.\n"
            f"{focus}\n\n"
            "Твоя задача: структурировать информацию по статье без повторов.\n\n"
            "Верни СТРОГО JSON (без markdown, без пояснений), формат:\n"
            "{\n"
            '  "summary": "2-3 предложения: о чем статья (без выводов и рисков)",\n'
            '  "facts": ["3-6 пунктов: только факты/цифры/события (без интерпретаций)"],\n'
            '  "conclusion": "1-2 предложения: что это значит для инвестора/рынка РФ (не совет)",\n'
            '  "explanation": ["2-4 пункта: почему так / какие механизмы влияния"],\n'
            '  "risks": ["2-4 пункта: риски и неопределенности (не повторять facts)"],\n'
            '  "indicator": {\n'
            '    "impact": "neutral",\n'
            '    "confidence": "medium",\n'
            '    "rationale": ["2-4 причины оценки impact"]\n'
            "  }\n"
            "}\n\n"
            "Правила:\n"
            "- summary не должен содержать conclusion/risks.\n"
            "- facts не должны повторять summary дословно.\n"
            "- risks не должны быть перефразированными facts.\n"
            '- indicator.impact: одно из ["positive","neutral","negative"].\n'
            '- indicator.confidence: одно из ["low","medium","high"].\n'
            "- Это НЕ инвестиционный совет.\n\n"
            f"Текст статьи:\n{raw_text}"
        )

    def _get_or_build_base(self, market: str, category: str, url: str, force: bool = False) -> dict:
        today = date.today()

        if not force:
            cached = self.cache_repo.get(cache_date=today, category=category, url=url)
            if cached:
                payload = _safe_json_loads(cached.payload_json)
                if not isinstance(payload, dict):
                    payload = {}
                payload["_meta"] = {
                    "asof": today.isoformat(),
                    "title": cached.title,
                    "source": cached.source,
                    "url": cached.url,
                }
                return payload

        raw_text = self.scraper.fetch_article_text(url)
        raw_text = _clean_and_truncate(raw_text, max_chars=15000)

        prompt = self._make_base_prompt(category=category, raw_text=raw_text)
        llm_out = self.llm.chat(prompt)

        payload = _safe_json_loads(llm_out)
        if not isinstance(payload, dict):
            payload = {"_error": "llm_invalid_json"}
        else:
            payload_json = json.dumps(payload, ensure_ascii=False)

            parsed = urlparse(url)
            source_name = parsed.netloc or url
            title = "Рынок РФ — макрообзор" if category == CATEGORY_MACRO else "Рынок РФ — обзор акций"

            self.cache_repo.upsert(
                cache_date=today,
                market=market,
                category=category,
                url=url,
                source=source_name,
                title=title,
                payload_json=payload_json,
            )

            payload["_meta"] = {
                "asof": today.isoformat(),
                "title": title,
                "source": source_name,
                "url": url,
            }

        return payload

    def _apply_user_overlay(self, user: User, payload: Optional[dict]) -> dict:
        if not isinstance(payload, dict):
            payload = {}

        bullets = payload.get("facts") or payload.get("bullets") or []
        conclusion = payload.get("conclusion") or ""
        text_blob = (" ".join(map(str, bullets)) + " " + str(conclusion)).upper()

        if user.tickers:
            matched = [t for t in user.tickers if t and t.upper() in text_blob]
            if matched:
                bullets = list(map(str, bullets))
                bullets.insert(0, f"Упоминаются тикеры из ваших интересов: {', '.join(matched)}")
                payload["facts"] = bullets

        return payload

    def execute(self, user: User, force: bool = False) -> List[NewsBlock]:
        blocks: List[NewsBlock] = []
        sources = self._pick_sources(max_blocks=3)
        if not sources:
            return []

        for market, category, url in sources:
            payload = self._get_or_build_base(
                market=market,
                category=category,
                url=url,
                force=force,
            )
            if not isinstance(payload, dict):
                payload = {}
            payload = self._apply_user_overlay(user=user, payload=payload)

            meta = payload.get("_meta") or {}
            title = meta.get("title") or (
                "Рынок РФ — макрообзор" if category == CATEGORY_MACRO else "Рынок РФ — обзор акций"
            )
            source = meta.get("source") or (urlparse(url).netloc or url)
            asof = date.fromisoformat(meta["asof"]) if meta.get("asof") else None

            summary: str = (payload.get("summary") or "").strip()

            facts: List[str] = payload.get("facts") or payload.get("bullets") or []
            facts = [str(x).strip() for x in facts if str(x).strip()]

            conclusion: Optional[str] = payload.get("conclusion")
            conclusion = conclusion.strip() if isinstance(conclusion, str) else conclusion

            risks: List[str] = payload.get("risks") or []
            risks = [str(x).strip() for x in risks if str(x).strip()]

            indicator_obj = payload.get("indicator") or {}
            indicator: Optional[NewsIndicator] = None

            if isinstance(indicator_obj, dict):
                impact = _norm_choice(indicator_obj.get("impact"), _ALLOWED_IMPACT)
                confidence = _norm_choice(indicator_obj.get("confidence"), _ALLOWED_CONFIDENCE)

                if impact and confidence:
                    indicator = NewsIndicator(
                        impact=impact,
                        confidence=confidence,
                        rationale=indicator_obj.get("rationale") or [],
                    )

            if not summary:
                fallback = _build_summary_text(bullets=facts, conclusion=conclusion, risks=risks)
                summary = fallback or "Нет данных для обзора."

            blocks.append(
                NewsBlock(
                    title=title,
                    source=source,
                    url=url,
                    summary=summary,
                    bullets=facts,
                    conclusion=conclusion,
                    risks=risks,
                    indicator=indicator,
                    asof=asof,
                )
            )

        return blocks
