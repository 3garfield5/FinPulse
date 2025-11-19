import requests

from app.application.interfaces.llm import ILLMService


class OllamaLLMService(ILLMService):
    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.url = "http://localhost:11434/api/generate"

    def chat(self, prompt: str, user_context: dict | None = None) -> str:
        """
        Отправляет промпт локальной модели Ollama и получает ответ.
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }

        try:
            response = requests.post(self.url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

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
        return self.chat(prompt, {})
