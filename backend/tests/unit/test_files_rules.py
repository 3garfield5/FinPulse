import pytest

from app.core.files_rules import MAX_SIZE_BYTES, is_allowed_mime


@pytest.mark.unit
def test_text_mime_is_allowed():
    assert is_allowed_mime("text/plain") is True


@pytest.mark.unit
def test_pdf_mime_is_allowed():
    assert is_allowed_mime("application/pdf") is True


@pytest.mark.unit
def test_unknown_binary_mime_is_not_allowed():
    assert is_allowed_mime("application/x-msdownload") is False


@pytest.mark.unit
def test_max_size_constant_is_10mb():
    assert MAX_SIZE_BYTES == 10 * 1024 * 1024
