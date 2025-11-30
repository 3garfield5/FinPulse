// src/pages/News.tsx
import React, { useEffect, useState } from "react";
import { getNewsFeed, NewsItem } from "../api/news";
import { MARKET_LABELS, CATEGORY_LABELS } from "../constants/dicts";

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const items = await getNewsFeed();
        setNews(items);
      } catch (err: any) {
        console.error("Ошибка загрузки новостей", err);

        if (err.response?.status === 401) {
          setErrorMsg("Сессия истекла, нужно заново войти в аккаунт.");
        } else {
          setErrorMsg("Не удалось загрузить новости. Попробуй позже.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Персональная лента новостей</h2>

        {loading && <p className="text-sm text-gray-500">Загружаю новости…</p>}
        {errorMsg && (
          <p className="text-sm text-red-500 mb-3">
            {errorMsg}
          </p>
        )}

        {!loading && !errorMsg && news.length === 0 && (
          <p className="text-sm text-gray-500">
            Пока нет новостей по твоим предпочтениям.
          </p>
        )}

        <div className="space-y-4">
          {news.map((item) => {
            const marketLabel = MARKET_LABELS[item.market] ?? item.market;
            const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;

            const date = item.published_at
              ? new Date(item.published_at).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <article
                key={item.id}
                className="border rounded p-3 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-base">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {item.title}
                    </a>
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {date}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {item.source}
                </p>

                {item.summary && (
                  <p className="text-sm text-gray-700 mt-2">
                    {item.summary}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Рынок: {marketLabel}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Категория: {categoryLabel}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="bg-white p-4 rounded shadow">
        <h4 className="font-semibold mb-2">Подсказка</h4>
        <p className="text-sm text-gray-600">
          Лента формируется на основе твоих рынков и категорий в профиле.
          Если хочешь другие темы — измени предпочтения в разделе{" "}
          <span className="font-medium">Профиль</span>.
        </p>
      </aside>
    </div>
  );
}
