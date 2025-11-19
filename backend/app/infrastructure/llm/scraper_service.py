import requests
from bs4 import BeautifulSoup


class ScraperService:
    """
    Сервис для получения и очистки текста статьи по URL.
    """

    def fetch_article_text(self, url: str) -> str:
        """
        Загружает страницу по URL и возвращает очищенный текст статьи.
        """
        try:
            response = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()
        except Exception as e:
            raise RuntimeError(f"Ошибка при загрузке статьи: {e}")

        soup = BeautifulSoup(response.text, "html.parser")

        for tag in soup(["script", "style", "noscript", "header", "footer", "form", "nav", "aside"]):
            tag.extract()

        article = soup.find("article")
        if article:
            text = article.get_text(separator=" ", strip=True)
        else:
            text = soup.get_text(separator=" ", strip=True)

        text = " ".join(text.split())
        return text
