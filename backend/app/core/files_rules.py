ALLOWED_MIME = {
    "application/pdf",
    "application/msword",  # .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
}


def is_allowed_mime(mime: str) -> bool:
    return mime.startswith("text/") or mime in ALLOWED_MIME


MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
