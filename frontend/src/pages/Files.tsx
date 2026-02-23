// src/pages/Files.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  listFilesByChat,
  initUpload,
  putToPresignedUrl,
  completeUpload,
  getDownloadUrl,
  deleteFile,
  FileOut,
} from "../api/files";
import { listChats, ChatSession } from "../api/chat";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function FilesPage() {
  const q = useQuery();
  const chatId = Number(q.get("chatId") || "0") || null;
  const [chatTitle, setChatTitle] = useState<string | null>(null);

  const [files, setFiles] = useState<FileOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    if (!chatId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const items = await listFilesByChat(chatId);
      setFiles(items);
    } catch (e) {
      console.error(e);
      setErrorMsg("Не удалось загрузить список файлов");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chatId) {
      setFiles([]);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    const loadChatTitle = async () => {
      if (!chatId) {
        setChatTitle(null);
        return;
      }
      try {
        const chats = await listChats();
        const chat = chats.find((c) => c.id === chatId) ?? null;

        if (!chat) {
          setChatTitle(`Чат #${chatId}`);
          return;
        }

        // косметика: дефолтный "Main" показываем как "Основной"
        const title =
          chat.is_default && (chat.title === "Main" || chat.title === "Main (default)")
            ? "Основной"
            : chat.title;

        setChatTitle(title);
      } catch (e) {
        console.error(e);
        setChatTitle(`Чат #${chatId}`);
      }
    };

    loadChatTitle();
  }, [chatId]);

  const onPick = () => {
    if (!chatId || uploading) return;
    inputRef.current?.click();
  };

  const onSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !chatId) return;

    const mimeType = f.type || "application/octet-stream";

    setUploading(true);
    setErrorMsg(null);
    try {
      const init = await initUpload({
        chat_id: chatId,
        original_name: f.name,
        mime_type: mimeType,
        size_bytes: f.size,
      });

      await putToPresignedUrl(init.upload_url, f, mimeType);
      await completeUpload(init.file_id, {});
      await refresh();
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 422 && detail === "UNSUPPORTED_MIME_TYPE") setErrorMsg("Неподдерживаемый тип файла");
      else if (status === 413 && detail === "FILE_TOO_LARGE") setErrorMsg("Файл слишком большой");
      else if (status === 409 && detail === "SIZE_MISMATCH") setErrorMsg("Размер файла не совпал после загрузки");
      else if (status === 502 && detail === "S3_UNAVAILABLE") setErrorMsg("Хранилище недоступно");
      else setErrorMsg("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (id: number) => {
    try {
      const { download_url } = await getDownloadUrl(id);
      const a = document.createElement("a");
      a.href = download_url;
      a.target = "_self";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      setErrorMsg("Не удалось получить ссылку на скачивание");
    }
  };

  const onDelete = async (id: number) => {
    if (!chatId) return;
    try {
      await deleteFile(id);
      await refresh();
    } catch (e) {
      console.error(e);
      setErrorMsg("Не удалось удалить файл");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500">Файлы чата</div>
          <div className="font-semibold truncate">
            {chatId ? (chatTitle ?? "Загрузка...") : "chatId не указан"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/chat" className="px-3 py-2 border rounded text-sm">
            Назад
          </Link>

          <input ref={inputRef} type="file" className="hidden" onChange={onSelected} />
          <button
            type="button"
            onClick={onPick}
            disabled={!chatId || uploading}
            className="px-3 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-60"
          >
            {uploading ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600 mb-3">{errorMsg}</div>}
      {loading && <div className="text-sm text-gray-500 mb-3">Загрузка…</div>}

      {!loading && chatId && files.length === 0 && <div className="text-sm text-gray-500">Файлов нет</div>}

      {!loading && chatId && files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 border rounded px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{f.original_name}</div>
                <div className="text-xs text-gray-500">
                  {f.is_ready ? "готов" : "обработка"} • {(f.size_bytes / 1024).toFixed(1)} KB • {f.mime_type}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="px-3 py-2 border rounded text-sm disabled:opacity-60"
                  disabled={!f.is_ready}
                  onClick={() => onDownload(f.id)}
                >
                  Скачать
                </button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded text-sm"
                  onClick={() => onDelete(f.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}