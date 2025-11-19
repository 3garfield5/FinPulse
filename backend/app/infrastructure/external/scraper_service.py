import requests
from bs4 import BeautifulSoup


class ScraperService:
    """
    Сервис для получения и очистки текста статьи по URL.
    """

    def fetch_article_text(self, url: str) -> str:
        """
        Загружает страницу по URL и возвращает очищенный текст.
        """
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except Exception as e:
            raise RuntimeError(f"Ошибка при загрузке статьи: {e}")

        soup = BeautifulSoup(response.text, "html.parser")

        # Удалим все скрипты и стили
        for tag in soup(["script", "style", "noscript"]):
            tag.extract()

        text = soup.get_text(separator=" ", strip=True)
        return text
