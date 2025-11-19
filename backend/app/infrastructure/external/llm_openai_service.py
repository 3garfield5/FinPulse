import openai
from app.application.interfaces.llm import ILLMService

class OpenAILLMService(ILLMService):
    def __init__(self, api_key: str):
        openai.api_key = api_key

    def chat(self, prompt: str, user_context: dict) -> str:
        completion = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return completion.choices[0].message["content"]

    def summarize(self, text: str) -> str:
        summary_prompt = f"Суммаризируй следующий текст:\n\n{text}"
        return self.chat(summary_prompt, {})
