// src/pages/Chat.tsx
import React, { useEffect, useState } from "react";
import Message from "../components/Message";
import { sendChatMessage, getChatHistory, ChatHistoryItem } from "../api/chat";

type MessageType = {
  id: number;
  author: string;
  text: string;
  time: string;
  isBot: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatTime = (date?: Date) => {
    const d = date ?? new Date();
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  // Подгружаем историю
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await getChatHistory(50);

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
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Отправка сообщения
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

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
      const response = await sendChatMessage({ message: userText });

      const botMessage: MessageType = {
        id: Date.now() + 1,
        author: "FinPulse",
        text: response.answer,
        time: formatTime(),
        isBot: true,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Ошибка отправки сообщения", err);
      setErrorMsg("Не удалось отправить сообщение");
    } finally {
      setIsTyping(false);
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-white p-4 rounded shadow h-[68vh] flex flex-col">
        <div className="overflow-auto mb-4 flex-1 space-y-2">
          {loadingHistory && <p className="text-sm text-gray-500">Загружаю историю...</p>}
          {errorMsg && <p className="text-sm text-red-500 mb-2">{errorMsg}</p>}

          {messages.map((m) => (
            <Message key={m.id} {...m} />
          ))}

          {/* 🔥 Индикатор печати */}
          {isTyping && (
            <div className="text-sm text-gray-500 italic px-2 py-1">
              FinPulse печатает…
            </div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>

      <aside className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Рекомендации от FinPulse</h3>
        <h4 className="font-semibold mb-2">Советы FinPulse</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Следите за новостями по вашему портфелю</li>
          <li>• Избегайте эмоциональных сделок</li>
          <li>• Перепроверяйте источники</li>
          <li>• Фиксируйте свои торговые решения</li>
        </ul>
      </aside>
    </div>
  );
}
