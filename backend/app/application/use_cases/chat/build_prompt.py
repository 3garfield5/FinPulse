from app.domain.entities.chat_message import ChatMessage

MAX_PROMPT_CHARS = 8000


def build_chat_context(messages: list[ChatMessage]) -> str:
    """
    Собирает контекст для модели из последних сообщений,
    обрезая по длине (по символам).
    """
    parts: list[str] = []
    total_len = 0

    for msg in reversed(messages):
        prefix = "User: " if msg.role == "user" else "FinPulse: "
        chunk = prefix + msg.content + "\n"
        chunk_len = len(chunk)

        if total_len + chunk_len > MAX_PROMPT_CHARS:
            break

        parts.append(chunk)
        total_len += chunk_len

    parts = list(reversed(parts))

    history_text = "".join(parts)
    system_prompt = (
        "Ты - FinPulse, финансовый ИИ асисстент, который помогает людям"
        "лучше понимать рынки, новости и собственные финансы.\n\n"
    )

    return system_prompt + history_text
