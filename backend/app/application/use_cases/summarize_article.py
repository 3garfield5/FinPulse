from typing import Optional
import requests

from app.application.interfaces.llm import ILLMService


class SummarizeArticle:
    """
    Use case: получает текст статьи по URL и создаёт краткое резюме.
    """

    def __init__(self, llm: ILLMService):
        self.llm = llm

    def execute(self, url: str) -> str:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                return "Не удалось получить статью. Проверьте ссылку."
            text = response.text

            summary = self.llm.summarize(self, text=text)
            return summary

        except Exception as e:
            return f"Ошибка при обработке статьи: {e}"
