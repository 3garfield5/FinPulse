import { api } from "./client";

export type NewsItem = {
  id: number;
  title: string;
  source: string;
  url: string;
  summary: string;
  published_at: string;
  market: string;
  category: string;
};

export async function getNewsFeed(): Promise<NewsItem[]> {
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

  const res = await api.get("/news/feed", {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {},
  });

  return res.data as NewsItem[];
}
