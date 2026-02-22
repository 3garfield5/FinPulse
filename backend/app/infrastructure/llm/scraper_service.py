import logging

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ScraperService:
    """
    Сервис для получения и очистки текста статьи по URL.
    """

    def fetch_article_text(self, url: str) -> str | None:
        """
        Загружает страницу по URL и возвращает очищенный текст статьи.
        При ошибке возвращает None (НЕ выбрасывает исключение).
        """
        try:
            response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()

        except Exception as e:
            logger.warning(f"[Scraper] Не удалось загрузить статью {url}: {e}")
            return None  # <-- ключевое изменение

        soup = BeautifulSoup(response.text, "html.parser")

        # Удаляем мусорные теги
        for tag in soup(["script", "style", "noscript", "header", "footer", "form", "nav", "aside"]):
            tag.extract()

        # Если есть тег <article> — используем его
        article = soup.find("article")
        if article:
            text = article.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)

        cleaned = " ".join(text.split())

        return cleaned or None
