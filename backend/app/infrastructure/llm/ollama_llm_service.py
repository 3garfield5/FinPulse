import requests
import os

from app.application.interfaces.llm import ILLMService
from app.core.settings import settings


class OllamaLLMService(ILLMService):
    def __init__(self):
        self.model = settings.OLLAMA_MODEL

        base = settings.OLLAMA_URL.rstrip("/")
        self.url = (
            base if base.endswith("/api/generate")
            else f"{base}/api/generate"
        )

    def chat(self, prompt: str, user_context: dict | None = None) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        try:
            r = requests.post(self.url, json=payload, timeout=120)
            if r.status_code >= 400:
                print("Ollama error:", r.status_code, r.text)
            r.raise_for_status()
            return r.json().get("response", "")
        except Exception as e:
            print("Ошибка обращения к Ollama:", e)
            return "Извините, FinPulse временно недоступен."

    def summarize(self, text: str) -> str:
        prompt = (
            "Суммаризируй следующий текст по-русски, кратко и ясно.\n"
            "Формат:\n"
            "- 3–5 буллетов с ключевыми фактами;\n"
            "- 1–2 предложения выводов для инвестора.\n\n"
            f"Текст:\n{text}"
        )
        return self.chat(prompt)
