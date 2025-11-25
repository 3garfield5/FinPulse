import React, { useState } from "react";
import Message from "../components/Message";
import { sendChatMessage } from "../api/chat";

type MessageType = {
  id: number;
  author: string;
  text: string;
  time: string;
  isBot: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      author: "FinPulse",
      text: "Привет! Чем могу помочь?",
      time: "только что",
      isBot: true,
    },
  ]);

  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatTime = () =>
    new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

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

    // сначала добавляем сообщение пользователя
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
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
      console.error(err);
      setErrorMsg("Не получилось получить ответ от сервера :(");

      const botErrorMessage: MessageType = {
        id: Date.now() + 2,
        author: "FinPulse",
        text: "Кажется, возникла ошибка при запросе к серверу. Попробуй ещё раз чуть позже.",
        time: formatTime(),
        isBot: true,
      };

      setMessages((prev) => [...prev, botErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-white p-4 rounded shadow h-[68vh] flex flex-col">
        <div className="overflow-auto mb-4 flex-1 space-y-2">
          {messages.map((m) => (
            <Message key={m.id} {...m} />
          ))}
          {loading && (
            <div className="text-xs text-gray-500 mt-2">
              FinPulse печатает...
            </div>
          )}
          {errorMsg && (
            <div className="text-xs text-red-500 mt-2">{errorMsg}</div>
          )}
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setText(e.target.value)
            }
            placeholder="Сообщение..."
            className="flex-1 border rounded px-3 py-2"
            disabled={loading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>

      <aside className="bg-white p-4 rounded shadow">
        <h4 className="font-semibold mb-2">Последние уведомления</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>AAPL выросла на 3.2%</li>
          <li>SBER вырос на 4 пункта!</li>
          <li>Bitcoin +5.8%</li>
        </ul>
      </aside>
    </div>
  );
}
