import { api } from "./client";

export type ChatResponse = {
  answer: string;
};

export type ChatHistoryItem = {
  id: number;
  role: "user" | "assistant" | "bot" | "FinPulse";
  content: string;
  created_at: string;
};

export async function sendChatMessage(payload: { message: string }) {
  const res = await api.post("/chat/send", payload);
  return res.data;
}

export async function getChatHistory(limit = 50) {
  const res = await api.get("/chat/history", { params: { limit } });
  return res.data;
}
