from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
import hashlib
import logging
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
from app.infrastructure.database.news_repo_impl import NewsRepositorySQL
from app.infrastructure.utils import slugify

_WS_RE = re.compile(r"\s+")

_ALLOWED_IMPACT = {"positive", "neutral", "negative"}
_ALLOWED_CONFIDENCE = {"low", "medium", "high"}

import re

_SLUG_RE = re.compile(r"[^a-zа-я0-9\s-]+", re.IGNORECASE)
_WS_RE2 = re.compile(r"\s+")
logger = logging.getLogger(__name__)

def slugify(text: str) -> str:
    t = (text or "").strip().lower()
    t = _SLUG_RE.sub("", t)
    t = _WS_RE2.sub("-", t)
    t = re.sub(r"-+", "-", t)
    return t.strip("-") or "news"


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
        news_repo: NewsRepositorySQL,
    ):
        self.scraper = scraper
        self.llm = llm
        self.cache_repo = cache_repo
        self.news_repo = news_repo

    def _pick_sources(
        self,
        user: Optional[User],
        *,
        audience: str,
        max_blocks: int = 3,
    ) -> list[tuple[str, str, str]]:
        picked: list[tuple[str, str, str]] = []
        market_sources = NEWS_SOURCES.get(MARKET_RU, {})
        def _prefer_scrape_friendly(urls: list[str]) -> list[str]:
            non_rbc = [u for u in urls if "rbc.ru" not in u]
            return non_rbc or urls

        macro_urls = _prefer_scrape_friendly(market_sources.get(CATEGORY_MACRO, []))
        if macro_urls:
            if audience == "public":
                picked.append((MARKET_RU, CATEGORY_MACRO, macro_urls[0]))
            else:
                key = self._user_persona_key(user)
                idx = self._stable_index(key + "|macro", len(macro_urls))
                picked.append((MARKET_RU, CATEGORY_MACRO, macro_urls[idx]))

        stocks_urls = _prefer_scrape_friendly(market_sources.get(CATEGORY_STOCKS, []))
        if audience == "public":
            for url in stocks_urls:
                if len(picked) >= max_blocks:
                    break
                picked.append((MARKET_RU, CATEGORY_STOCKS, url))
        else:
            if stocks_urls:
                key = self._user_persona_key(user)
                start = self._stable_index(key + "|stocks", len(stocks_urls))
                rotated = stocks_urls[start:] + stocks_urls[:start]
                for url in rotated:
                    if len(picked) >= max_blocks:
                        break
                    picked.append((MARKET_RU, CATEGORY_STOCKS, url))

        return picked[:max_blocks]

    def _make_base_prompt(self, category: str, raw_text: str, user: Optional[User], audience: str) -> str:
        focus = (
            "Фокус: макро РФ (ставки, инфляция, бюджет, санкции, нефть как фактор для РФ, влияние на рынок акций)."
            if category == CATEGORY_MACRO
            else "Фокус: корпоративные новости РФ (отчетности, дивиденды, сделки, регулирование, сектора и крупные эмитенты)."
        )
        persona_hint = ""
        if audience == "personal" and user is not None:
            persona_hint = (
                "\nПрофиль пользователя:\n"
                f"- горизонт: {user.investment_horizon or 'не указан'}\n"
                f"- риск: {user.risk_level or 'не указан'}\n"
                f"- тикеры: {', '.join(user.tickers) if user.tickers else 'не указаны'}\n"
                f"- секторы: {', '.join(user.sectors) if user.sectors else 'не указаны'}\n"
                "Сделай вывод чуть более прикладным к профилю пользователя.\n"
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
            f"{persona_hint}\n"
            f"Текст статьи:\n{raw_text}"
        )

    def _get_or_build_base(
        self,
        market: str,
        category: str,
        url: str,
        user: Optional[User],
        *,
        audience: str,
        force: bool = False,
    ) -> dict:
        now = datetime.now(timezone.utc)
        today = now.date()
        hour_slot = now.replace(minute=0, second=0, microsecond=0).strftime("%Y%m%d%H")
        cache_category = f"{category}::aud={audience}::slot={hour_slot}"

        if not force:
            cached = self.cache_repo.get(cache_date=today, category=cache_category, url=url)
            if cached:
                payload = _safe_json_loads(cached.payload_json)
                if not isinstance(payload, dict):
                    payload = {}
                payload["_meta"] = {
                    "asof": today.isoformat(),
                    "title": cached.title,
                    "source": cached.source,
                    "url": cached.url,
                    "hour_slot": hour_slot,
                }
                return payload

        parsed = urlparse(url)
        source_name = parsed.netloc or url
        title = "Рынок РФ — макрообзор" if category == CATEGORY_MACRO else "Рынок РФ — обзор акций"

        raw_text = self.scraper.fetch_article_text(url)
        raw_text = _clean_and_truncate(raw_text or "", max_chars=15000)

        if not raw_text:
            payload = self._build_fallback_payload(
                title=title,
                source=source_name,
                url=url,
                audience=audience,
                reason="Источник временно недоступен",
            )
        else:
            try:
                prompt = self._make_base_prompt(category=category, raw_text=raw_text, user=user, audience=audience)
                llm_out = self.llm.chat(prompt)
                payload = _safe_json_loads(llm_out)
                if not isinstance(payload, dict):
                    payload = self._build_fallback_payload(
                        title=title,
                        source=source_name,
                        url=url,
                        audience=audience,
                        reason="LLM вернул некорректный формат",
                    )
            except Exception as e:
                logger.warning("LLM недоступен для %s: %s", url, e)
                payload = self._build_fallback_payload(
                    title=title,
                    source=source_name,
                    url=url,
                    audience=audience,
                    reason="Сервис аналитики временно недоступен",
                )

        payload_json = json.dumps(payload, ensure_ascii=False)
        self.cache_repo.upsert(
            cache_date=today,
            market=market,
            category=cache_category,
            url=url,
            source=source_name,
            title=title,
            payload_json=payload_json,
        )

        if audience == "public":
            self.news_repo.upsert_by_url(
                url=url,
                title=title,
                slug=slugify(title),
                source=source_name,
                payload_json=payload_json,
                asof=today,
                market=market,
                category=category,
                is_public=True,
            )

        payload["_meta"] = {
            "asof": today.isoformat(),
            "title": title,
            "source": source_name,
            "url": url,
            "hour_slot": hour_slot,
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
        else:
            bullets = list(map(str, bullets))
            bullets.insert(0, "Лента персонализирована под ваш профиль риска и горизонт инвестирования.")
            payload["facts"] = bullets

        return payload

    def execute(self, user: User, force: bool = False, audience: str = "personal") -> List[NewsBlock]:
        blocks: List[NewsBlock] = []
        sources = self._pick_sources(user=user, audience=audience, max_blocks=3)
        if not sources:
            return []

        for market, category, url in sources:
            payload = self._get_or_build_base(
                market=market,
                category=category,
                url=url,
                user=user,
                audience=audience,
                force=force,
            )
            if not isinstance(payload, dict):
                payload = {}
            if audience == "personal":
                payload = self._apply_user_overlay(user=user, payload=payload)

            meta = payload.get("_meta") or {}
            title = meta.get("title") or (
                "Рынок РФ — макрообзор" if category == CATEGORY_MACRO else "Рынок РФ — обзор акций"
            )
            if audience == "personal":
                title = f"Персонально: {title}"
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

            news_id = f"{(asof.isoformat() if asof else date.today().isoformat())}|{audience}|{category}|{url}"
            news_slug = slugify(title)

            blocks.append(
                NewsBlock(
                    id=news_id,
                    slug=news_slug,
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

    @staticmethod
    def _build_fallback_payload(
        *,
        title: str,
        source: str,
        url: str,
        audience: str,
        reason: str,
    ) -> dict:
        summary_prefix = "Персональный обзор" if audience == "personal" else "Публичный обзор"
        return {
            "summary": f"{summary_prefix}: {title}. {reason}.",
            "facts": [
                f"Источник: {source}",
                f"Ссылка: {url}",
            ],
            "conclusion": "Показываем базовую карточку без AI-аналитики.",
            "risks": [
                reason,
            ],
            "indicator": {
                "impact": "neutral",
                "confidence": "low",
                "rationale": ["Недостаточно данных для уверенной оценки."],
            },
            "_fallback": True,
        }

    @staticmethod
    def _stable_index(seed: str, size: int) -> int:
        if size <= 0:
            return 0
        digest = hashlib.sha1(seed.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % size

    @staticmethod
    def _user_persona_key(user: Optional[User]) -> str:
        if user is None:
            return "public"
        parts = [
            str(user.id or 0),
            user.investment_horizon or "",
            user.risk_level or "",
            ",".join(sorted(user.tickers or [])),
            ",".join(sorted(user.sectors or [])),
        ]
        return "|".join(parts)
