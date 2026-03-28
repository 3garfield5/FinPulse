from types import SimpleNamespace

import pytest


@pytest.mark.integration
def test_files_init_upload_forbidden_for_user_role(client, auth_headers_for, fake_chat_repo, fake_user_repo):
    user = fake_user_repo.get_by_email("user@example.com")
    assert user is not None
    chat = fake_chat_repo.get_or_create_default(user.id)

    res = client.post(
        "/files/init-upload",
        headers=auth_headers_for("user@example.com"),
        json={
            "chat_id": chat.id,
            "original_name": "a.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 1024,
        },
    )
    assert res.status_code == 403


@pytest.mark.integration
def test_files_init_upload_validates_mime_and_size(client, auth_headers_for, fake_chat_repo, fake_user_repo):
    pro = fake_user_repo.get_by_email("pro@example.com")
    assert pro is not None
    chat = fake_chat_repo.get_or_create_default(pro.id)

    bad_mime = client.post(
        "/files/init-upload",
        headers=auth_headers_for("pro@example.com"),
        json={
            "chat_id": chat.id,
            "original_name": "virus.exe",
            "mime_type": "application/x-msdownload",
            "size_bytes": 10,
        },
    )
    assert bad_mime.status_code == 422
    assert bad_mime.json()["detail"] == "UNSUPPORTED_MIME_TYPE"

    too_large = client.post(
        "/files/init-upload",
        headers=auth_headers_for("pro@example.com"),
        json={
            "chat_id": chat.id,
            "original_name": "big.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 20 * 1024 * 1024,
        },
    )
    assert too_large.status_code == 413
    assert too_large.json()["detail"] == "FILE_TOO_LARGE"


@pytest.mark.integration
def test_files_upload_complete_download_delete_flow(client, auth_headers_for, fake_chat_repo, fake_user_repo, monkeypatch):
    from app.presentation.api import files as files_api

    class FakeS3:
        def __init__(self) -> None:
            self.deleted = False

        def generate_presigned_url(self, ClientMethod, Params, ExpiresIn):
            return f"https://s3.local/{ClientMethod}/{Params['Key']}?exp={ExpiresIn}"

        def head_object(self, Bucket, Key):
            del Bucket
            del Key
            return {"ContentLength": 512}

        def delete_object(self, Bucket, Key):
            del Bucket
            del Key
            self.deleted = True
            return {}

    fake_s3 = FakeS3()
    monkeypatch.setattr(files_api, "get_s3_client", lambda public=False: fake_s3)

    class _FakeQuery:
        def filter(self, *args, **kwargs):
            del args
            del kwargs
            return self

        def first(self):
            return SimpleNamespace(object_key="tmp")

    class _FakeSession:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            del exc_type
            del exc
            del tb

        def query(self, model):
            del model
            return _FakeQuery()

        def commit(self):
            return None

    monkeypatch.setattr(files_api, "SessionLocal", lambda: _FakeSession())

    pro = fake_user_repo.get_by_email("pro@example.com")
    assert pro is not None
    chat = fake_chat_repo.get_or_create_default(pro.id)

    init_res = client.post(
        "/files/init-upload",
        headers=auth_headers_for("pro@example.com"),
        json={
            "chat_id": chat.id,
            "original_name": "doc.pdf",
            "mime_type": "application/pdf",
            "size_bytes": 512,
        },
    )
    assert init_res.status_code == 200
    file_id = init_res.json()["file_id"]

    complete_res = client.post(f"/files/{file_id}/complete", headers=auth_headers_for("pro@example.com"), json={})
    assert complete_res.status_code == 200
    assert complete_res.json()["is_ready"] is True

    list_res = client.get(f"/files/by-chat/{chat.id}", headers=auth_headers_for("pro@example.com"))
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    dl_res = client.get(f"/files/{file_id}/download-url", headers=auth_headers_for("pro@example.com"))
    assert dl_res.status_code == 200
    assert "get_object" in dl_res.json()["download_url"]

    del_res = client.delete(f"/files/{file_id}", headers=auth_headers_for("pro@example.com"))
    assert del_res.status_code == 200
    assert del_res.json()["ok"] is True


@pytest.mark.integration
def test_complete_upload_returns_409_when_s3_object_missing(client, auth_headers_for, fake_chat_repo, fake_user_repo, fake_file_repo, monkeypatch):
    from app.presentation.api import files as files_api

    class BrokenS3:
        def generate_presigned_url(self, ClientMethod, Params, ExpiresIn):
            del ClientMethod
            del Params
            del ExpiresIn
            return "https://s3.local/put"

        def head_object(self, Bucket, Key):
            del Bucket
            del Key
            raise RuntimeError("not found")

    monkeypatch.setattr(files_api, "get_s3_client", lambda public=False: BrokenS3())

    pro = fake_user_repo.get_by_email("pro@example.com")
    assert pro is not None
    chat = fake_chat_repo.get_or_create_default(pro.id)
    created = fake_file_repo.create_pending(pro.id, chat.id, "x.pdf", "application/pdf", 100, "k1")

    res = client.post(f"/files/{created.id}/complete", headers=auth_headers_for("pro@example.com"), json={})
    assert res.status_code == 409
    assert res.json()["detail"] == "S3_OBJECT_NOT_FOUND"
