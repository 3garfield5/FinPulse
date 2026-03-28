import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SeoHead from "../components/SeoHead";
import { getPublicNewsFeed, NewsItem } from "../api/news";

const NewsCard = React.lazy(() => import("../components/NewsCard"));
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

function formatAsof(asof: string | null) {
  if (!asof) return "";
  const [y, m, d] = asof.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedFeed: { at: number; items: NewsItem[] } | null = null;

export default function PublicNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (cachedFeed && Date.now() - cachedFeed.at < CACHE_TTL_MS) {
          setNews(cachedFeed.items);
          return;
        }

        const items = await getPublicNewsFeed(50);
        cachedFeed = { at: Date.now(), items };
        setNews(items);
      } catch (err: any) {
        console.error("Ошибка загрузки публичных новостей", err);
        if (err?.response?.status === 503) {
          setErrorMsg("Внешний источник временно недоступен. Показываем ленту позже.");
        } else {
          setErrorMsg("Не удалось загрузить новости.");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadNews();
  }, []);

  const asofLabel = useMemo(() => (news.length ? formatAsof(news[0].asof) : ""), [news]);

  const structuredData = useMemo(() => {
    const top = news.slice(0, 5);
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Публичная лента новостей FinPulse",
        description: "Ключевые новости российского фондового рынка с краткой аналитикой.",
        mainEntity: top.map((item) => ({
          "@type": "NewsArticle",
          headline: item.title,
          datePublished: item.asof ?? undefined,
          url: `${SITE_URL}/news/public/${item.slug}`,
          publisher: { "@type": "Organization", name: "FinPulse" },
        })),
    };
  }, [news]);

  return (
    <>
      <SeoHead
        title="Публичные новости рынка РФ | FinPulse"
        description="Публичная лента ключевых новостей российского фондового рынка с краткими выводами и рисками."
        canonicalPath="/news/public"
        type="website"
        structuredData={structuredData}
      />

      <section className="grid md:grid-cols-3 gap-6">
        <article className="md:col-span-2 bg-white p-4 rounded shadow">
          <header className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Публичная лента новостей</h1>
              {asofLabel && <p className="text-xs text-gray-500 mt-1">Обзор на {asofLabel}</p>}
            </div>
          </header>

          {loading && <p className="text-sm text-gray-500">Загружаю новости...</p>}
          {errorMsg && <p className="text-sm text-red-500 mb-3">{errorMsg}</p>}
          {!loading && !errorMsg && news.length === 0 && (
            <p className="text-sm text-gray-500">Пока нет опубликованных материалов.</p>
          )}

          <div className="space-y-4">
            <Suspense fallback={<p className="text-sm text-gray-500">Подгружаю карточки...</p>}>
              {news.map((item) => (
                <div key={String(item.id)} className="space-y-2">
                  <NewsCard item={item} />
                  <Link
                    to={`/news/public/${item.slug}`}
                    className="inline-block text-sm text-blue-600 hover:underline"
                  >
                    Открыть страницу новости
                  </Link>
                </div>
              ))}
            </Suspense>
          </div>
        </article>

        <aside className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="font-semibold">Что это за раздел</h2>
          <p className="text-sm text-gray-600">
            Это индексируемая версия новостной ленты для поисковых систем и внешних ссылок.
          </p>
        </aside>
      </section>
    </>
  );
}
