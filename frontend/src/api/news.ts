import { api } from "./client";

export type Impact = "positive" | "neutral" | "negative";
export type Confidence = "low" | "medium" | "high";

export type NewsIndicator = {
  impact: Impact;
  confidence: Confidence;
  rationale: string[];
};

export type NewsItem = {
  id: string | number;
  slug: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  bullets: string[];
  conclusion: string | null;
  risks: string[];
  indicator: NewsIndicator | null;
  asof: string | null;
};

export async function getNewsFeed(): Promise<NewsItem[]> {
  const res = await api.get<NewsItem[]>("/news/feed");
  return res.data;
}

export async function getNewsItem(id: number): Promise<NewsItem> {
  const res = await api.get<NewsItem>(`/news/${id}`);
  return res.data;
}

export async function getPublicNewsFeed(limit = 50): Promise<NewsItem[]> {
  const res = await api.get<NewsItem[]>("/public/news", {
    params: { limit },
  });
  return res.data;
}

export async function getPublicNewsItemBySlug(slug: string): Promise<NewsItem> {
  const res = await api.get<NewsItem>(`/public/news/slug/${encodeURIComponent(slug)}`);
  return res.data;
}
