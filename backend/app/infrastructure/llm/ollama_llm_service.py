import threading

import requests

from app.application.interfaces.llm import ILLMService
from app.core.settings import settings

_OLLAMA_MAX_CONCURRENCY = int(getattr(settings, "OLLAMA_MAX_CONCURRENCY", 1))
_OLLAMA_SEMAPHORE = threading.BoundedSemaphore(_OLLAMA_MAX_CONCURRENCY)


class OllamaLLMService(ILLMService):
    def __init__(self):
        self.model = settings.OLLAMA_MODEL
        base = settings.OLLAMA_URL.rstrip("/")
        self.url = base if base.endswith("/api/generate") else f"{base}/api/generate"

    def chat(self, prompt: str, user_context: dict | None = None) -> str:
        payload = {"model": self.model, "prompt": prompt, "stream": False}

        acquired = _OLLAMA_SEMAPHORE.acquire()
        if not acquired:
            raise RuntimeError("Ollama busy: too many concurrent requests")

        try:
            r = requests.post(self.url, json=payload, timeout=120)

            if r.status_code >= 400:
                msg = r.text[:500]
                raise RuntimeError(f"Ollama HTTP {r.status_code}: {msg}")

            return r.json().get("response", "") or ""

        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            raise RuntimeError(f"Ollama unreachable: {e}") from e

        finally:
            _OLLAMA_SEMAPHORE.release()
