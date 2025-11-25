import { api }  from "./client";

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  answer: string;
}

export async function sendChatMessage(
  payload: ChatRequest
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat/send", payload);
  return data;
}
