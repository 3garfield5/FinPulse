import { api } from "./client";

export type Impact = "positive" | "neutral" | "negative";
export type Confidence = "low" | "medium" | "high";

export type NewsIndicator = {
  impact: Impact;
  confidence: Confidence;
  rationale: string[];
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;

  summary: string;

  bullets: string[];
  conclusion: string | null;
  risks: string[];

  indicator: NewsIndicator | null;

  // ISO date: "2026-01-13"
  asof: string | null;
};

export async function getNewsFeed(): Promise<NewsItem[]> {
  const res = await api.get<NewsItem[]>("/news/feed");
  return res.data;
}
