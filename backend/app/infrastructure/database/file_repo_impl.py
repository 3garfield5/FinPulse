from sqlalchemy.orm import sessionmaker

from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import FileModel


class FileRepositorySQL:
    def __init__(self, session_factory: sessionmaker = SessionLocal):
        self._session_factory = session_factory

    def create_pending(
        self, owner_id: int, chat_id: int, original_name: str, mime_type: str, size_bytes: int, object_key: str
    ) -> FileModel:
        with self._session_factory() as session:
            f = FileModel(
                owner_id=owner_id,
                chat_id=chat_id,
                original_name=original_name,
                mime_type=mime_type,
                size_bytes=size_bytes,
                object_key=object_key,
                is_ready=False,
            )
            session.add(f)
            session.commit()
            session.refresh(f)
            return f

    def mark_ready(self, file_id: int) -> FileModel | None:
        with self._session_factory() as session:
            f = session.query(FileModel).filter(FileModel.id == file_id).first()
            if not f:
                return None
            f.is_ready = True
            session.commit()
            session.refresh(f)
            return f

    def get_owned(self, file_id: int, owner_id: int) -> FileModel | None:
        with self._session_factory() as session:
            return session.query(FileModel).filter(FileModel.id == file_id, FileModel.owner_id == owner_id).first()

    def list_by_chat(self, chat_id: int, owner_id: int) -> list[FileModel]:
        with self._session_factory() as session:
            return (
                session.query(FileModel)
                .filter(FileModel.chat_id == chat_id, FileModel.owner_id == owner_id)
                .order_by(FileModel.created_at.desc())
                .all()
            )

    def delete_owned(self, file_id: int, owner_id: int) -> FileModel | None:
        with self._session_factory() as session:
            f = session.query(FileModel).filter(FileModel.id == file_id, FileModel.owner_id == owner_id).first()
            if not f:
                return None
            session.delete(f)
            session.commit()
            return f
