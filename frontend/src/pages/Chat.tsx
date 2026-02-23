import React, { useEffect, useMemo, useRef, useState } from "react";
import Message from "../components/Message";
import {
  initUpload,
  completeUpload,
  listFilesByChat,
  getDownloadUrl,
  deleteFile as apiDeleteFile,
  putToPresignedUrl,
  FileOut,
} from "../api/files";
import {
  sendChatMessage,
  getChatHistory,
  listChats,
  createChat,
  deleteChat,
  ChatSession,
} from "../api/chat";

type MessageType = {
  id: number;
  author: string;
  text: string;
  time: string;
  isBot: boolean;
};

export default function Chat() {
  // files (временно оставляем, но убираем из UI — логика пригодится для будущей страницы Files)
  const [files, setFiles] = useState<FileOut[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [loadingChats, setLoadingChats] = useState(true);

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatTime = (date?: Date) => {
    const d = date ?? new Date();
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  // 1) Загрузка списка чатов
  useEffect(() => {
    reloadChats(null)
    const loadChats = async () => {
      setLoadingChats(true);
      setErrorMsg(null);
      try {
        const list = await listChats();
        setChats(list);
        setSelectedChatId(list[0]?.id ?? null);
      } catch (err) {
        console.error("Ошибка загрузки чатов", err);
        setErrorMsg("Не удалось загрузить список чатов");
      } finally {
        setLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  // 2) Подгружаем историю при смене чата
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedChatId) return;

      setLoadingHistory(true);
      setErrorMsg(null);
      try {
        const history = await getChatHistory(50, selectedChatId);

        const mapped: MessageType[] = history.map((h) => ({
          id: h.id,
          author: h.role === "FinPulse" ? "FinPulse" : "Пользователь",
          text: h.content,
          time: formatTime(new Date(h.created_at)),
          isBot: h.role === "FinPulse",
        }));

        setMessages(mapped);
      } catch (err) {
        console.error("Ошибка загрузки истории", err);
        setErrorMsg("Не удалось загрузить историю чата");
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [selectedChatId]);

  // (опционально) подгружаем файлы, чтобы сразу отображать корректный статус upload/ready при переходе к Files-странице
  useEffect(() => {
    const loadFiles = async () => {
      if (!selectedChatId) {
        setFiles([]);
        return;
      }
      setFilesLoading(true);
      try {
        const items = await listFilesByChat(selectedChatId);
        setFiles(items);
      } catch (err) {
        console.error("Ошибка загрузки файлов", err);
        setFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };

    loadFiles();
  }, [selectedChatId]);

  // 3) Создание нового чата
  const onCreateChat = async () => {
    const title = window.prompt("Название чата:");
    if (!title?.trim()) return;

    setErrorMsg(null);
    try {
      const created = await createChat({ title: title.trim(), topic: null });
      setChats((prev) => [created, ...prev]);
      setSelectedChatId(created.id);
    } catch (err) {
      console.error("Ошибка создания чата", err);
      setErrorMsg("Создание новых чатов доступно только Pro/Admin");
    }
  };

  // 4) Отправка сообщения
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading || !selectedChatId) return;

    const userText = text.trim();
    setText("");
    setErrorMsg(null);

    const userMessage: MessageType = {
      id: Date.now(),
      author: "Пользователь",
      text: userText,
      time: formatTime(),
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await sendChatMessage({ message: userText, chat_id: selectedChatId });

      const botMessage: MessageType = {
        id: Date.now() + 1,
        author: "FinPulse",
        text: response.answer,
        time: formatTime(),
        isBot: true,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (response.chat_id && response.chat_id !== selectedChatId) {
        setSelectedChatId(response.chat_id);
      }
    } catch (err) {
      console.error("Ошибка отправки сообщения", err);
      setErrorMsg("Не удалось отправить сообщение");
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  // Upload остаётся доступным с кнопки 📎, но список вложений из чата убираем.
  const onPickFile = () => {
    if (!selectedChatId || uploading) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !selectedChatId) return;

    setErrorMsg(null);
    setUploading(true);
    const mimeType = f.type || "application/octet-stream";

    try {
        const init = await initUpload({
          chat_id: selectedChatId,
          original_name: f.name,
          mime_type: mimeType,
          size_bytes: f.size,
        });

      await putToPresignedUrl(init.upload_url, f, mimeType);
      await completeUpload(init.file_id, {});

      const items = await listFilesByChat(selectedChatId);
      setFiles(items);
    } catch (err: any) {
      console.error("Ошибка загрузки файла", err);

      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 422 && detail === "UNSUPPORTED_MIME_TYPE") {
        setErrorMsg("Неподдерживаемый тип файла");
      } else if (status === 413 && detail === "FILE_TOO_LARGE") {
        setErrorMsg("Файл слишком большой");
      } else if (status === 409 && detail === "SIZE_MISMATCH") {
        setErrorMsg("Размер файла не совпал после загрузки");
      } else if (status === 409 && detail === "S3_OBJECT_NOT_FOUND") {
        setErrorMsg("Файл не найден в хранилище после загрузки");
      } else {
        setErrorMsg("Не удалось загрузить файл");
      }
    } finally {
      setUploading(false);
    }
  };

  // Эти хендлеры пригодятся на будущей странице Files
  const onDownload = async (fileId: number) => {
    try {
      const { download_url } = await getDownloadUrl(fileId);
      window.open(download_url, "_blank");
    } catch (err) {
      console.error("Ошибка получения ссылки скачивания", err);
      setErrorMsg("Не удалось получить ссылку на скачивание");
    }
  };

  const onDeleteFile = async (fileId: number) => {
    if (!selectedChatId) return;
    try {
      await apiDeleteFile(fileId);
      const items = await listFilesByChat(selectedChatId);
      setFiles(items);
    } catch (err) {
      console.error("Ошибка удаления файла", err);
      setErrorMsg("Не удалось удалить файл");
    }
  };

  const onDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      await reloadChats(null); // после удаления просто переезжаем на первый чат
    } catch (e: any) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      if (detail === "CANNOT_DELETE_DEFAULT_CHAT") setErrorMsg("Нельзя удалить основной чат");
      else setErrorMsg("Не удалось удалить чат");
    }
  };

  const reloadChats = async (preferredChatId?: number | null) => {
  setLoadingChats(true);
  try {
    const list = await listChats();
    setChats(list);

    const nextId =
      preferredChatId && list.some((c) => c.id === preferredChatId)
        ? preferredChatId
        : list[0]?.id ?? null;

    setSelectedChatId(nextId);
  } catch (e) {
    console.error(e);
    setErrorMsg("Не удалось обновить список чатов");
  } finally {
    setLoadingChats(false);
  }
};
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Левая часть: чат */}
      <div className="md:col-span-2 bg-white p-4 rounded shadow h-[68vh] flex flex-col">
        {/* Header: текущий чат + быстрые действия */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Текущий чат</div>
            <div className="font-semibold truncate">
              {loadingChats ? "Загрузка..." : selectedChat?.title ?? "Чат"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Кнопка на будущую страницу файлов (пока просто якорь/заглушка) */}
            <button
              type="button"
              className="px-3 py-2 border rounded text-sm disabled:opacity-60"
              disabled={!selectedChatId}
              onClick={() => {
                if (!selectedChatId) return;
                // подстрой под ваш роутинг:
                // - если есть react-router: navigate(`/files?chatId=${selectedChatId}`)
                // - если нет: можно оставить location.href
                window.location.href = `/files?chatId=${selectedChatId}`;
              }}
              title="Открыть вложения чата"
            >
              Файлы
            </button>
          </div>
        </div>

        <div className="overflow-auto mb-4 flex-1 space-y-2">
          {errorMsg && <p className="text-sm text-red-500 mb-2">{errorMsg}</p>}
          {loadingHistory && <p className="text-sm text-gray-500">Загружаю историю...</p>}

          {!loadingHistory && messages.length === 0 && (
            <p className="text-sm text-gray-500">Сообщений пока нет. Напишите первое.</p>
          )}

          {messages.map((m) => (
            <Message key={m.id} {...m} />
          ))}

          {isTyping && (
            <div className="text-sm text-gray-500 italic px-2 py-1">
              FinPulse печатает…
            </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />

          <button
            type="button"
            onClick={onPickFile}
            disabled={!selectedChatId || uploading}
            className="px-3 py-2 border rounded disabled:opacity-60"
            title="Прикрепить файл"
          >
            {uploading ? "Загрузка..." : "📎"}
          </button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 border rounded px-3 py-2"
            disabled={loading || !selectedChatId}
          />

          <button
            type="submit"
            disabled={loading || !text.trim() || !selectedChatId}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>

        {/* Временный скрытый блок: чтобы TS не ругался на неиспользуемые handlers/state,
            пока не вынесли Files в отдельную страницу. Удалишь после вынесения. */}
        <div className="hidden">
          {String(filesLoading)}
          {files.map((f) => (
            <div key={f.id}>
              <button type="button" onClick={() => onDownload(f.id)} />
              <button type="button" onClick={() => onDeleteFile(f.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Правая часть: список чатов (вместо рекомендаций) */}
      <aside className="bg-white p-4 rounded shadow h-[68vh] flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold">Чаты</h3>
          <button
            type="button"
            onClick={onCreateChat}
            className="px-3 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-60"
            disabled={loadingChats}
          >
            Новый чат
          </button>
        </div>

        <div className="text-sm text-gray-500 mb-2">
          {loadingChats ? "Загрузка..." : `${chats.length} шт.`}
        </div>

        <div className="overflow-auto flex-1 space-y-2">
          {chats.map((c) => {
            const isActive = c.id === selectedChatId;

            const title = c.is_default && (c.title === "Main" || c.title === "Main (default)")
              ? "Основной"
              : c.title;

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedChatId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedChatId(c.id);
                }}
                className={[
                  "w-full border rounded px-3 py-2 flex items-center justify-between gap-2 cursor-pointer",
                  isActive ? "border-gray-900" : "border-gray-200",
                ].join(" ")}
                title={title}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {title} {c.is_default ? "" : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (c.is_default) {
                      setErrorMsg("Нельзя удалить основной чат");
                      return;
                    }
                    if (!window.confirm(`Удалить чат "${title}"?`)) return;
                    onDeleteChat(c.id);
                  }}
                  className="shrink-0 p-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  disabled={c.is_default}
                  title={c.is_default ? "Нельзя удалить основной чат" : "Удалить чат"}
                  aria-label="Удалить чат"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}