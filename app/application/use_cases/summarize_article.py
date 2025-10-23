# app/application/use_cases/summarize_article.py
from typing import Optional
import requests


class SummarizeArticle:
    """
    Use case: получает текст статьи по URL и создаёт краткое резюме.
    (в реальности тут может быть вызов LLM, но сейчас — простая логика)
    """

    def __init__(self, llm_client: Optional[object] = None):
        self.llm_client = llm_client  # можно потом подставить OpenAI / Gemini и т.д.

    def execute(self, url: str) -> str:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                return "Не удалось получить статью. Проверьте ссылку."
            text = response.text

            # Простейшая "суммаризация" — просто усечение текста
            summary = self._fake_summarize(text)
            return summary

        except Exception as e:
            return f"Ошибка при обработке статьи: {e}"

    def _fake_summarize(self, text: str) -> str:
        """Временная заглушка суммаризации"""
        clean_text = text.strip().replace("\n", " ")
        if len(clean_text) > 500:
            return clean_text[:500] + "..."
        return clean_text
