import { api } from "./client";

export type ChatResponse = {
  answer: string;
};

export async function sendChatMessage(payload: { message: string }): Promise<ChatResponse> {
  const raw = localStorage.getItem("auth_tokens");
  let accessToken: string | null = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      accessToken = parsed.accessToken ?? null;
    } catch {
      accessToken = null;
    }
  }

  const res = await api.post("/chat/send", payload, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {},
  });

  return res.data as ChatResponse;
}

export type ChatHistoryItem = {
  id: number;
  role: "user" | "assistant" | "bot" | "FinPulse"; // ← добавили варианты
  content: string;
  created_at: string;
};


export async function getChatHistory(limit = 50): Promise<ChatHistoryItem[]> {
  const raw = localStorage.getItem("auth_tokens");
  let accessToken: string | null = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      accessToken = parsed.accessToken ?? null;
    } catch {
      accessToken = null;
    }
  }

  const res = await api.get("/chat/history", {
    params: { limit },
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {},
  });

  return res.data as ChatHistoryItem[];
}
