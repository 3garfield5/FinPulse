import React, { useEffect, useMemo, useState } from "react";
import { getNewsFeed, NewsItem } from "../api/news";
import NewsCard from "../components/NewsCard";

function formatAsof(asof: string | null) {
  if (!asof) return "";
  // asof приходит как "YYYY-MM-DD"
  const [y, m, d] = asof.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

        if (err?.response?.status === 401) {
          setErrorMsg("Сессия истекла, нужно заново войти в аккаунт.");
        } else if (err?.response?.status === 503) {
          setErrorMsg("Сервис анализа временно недоступен (LLM). Попробуй позже.");
        } else {
          setErrorMsg("Не удалось загрузить новости. Попробуй позже.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const asofLabel = useMemo(() => {
    // берём дату из первого блока (все блоки обычно одного дня)
    return news.length ? formatAsof(news[0].asof) : "";
  }, [news]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <section className="md:col-span-2 bg-white p-4 rounded shadow">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold">Персональная лента новостей</h2>
            {asofLabel && (
              <p className="text-xs text-gray-500 mt-1">Обзор на {asofLabel}</p>
            )}
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Загружаю новости…</p>}

        {errorMsg && <p className="text-sm text-red-500 mb-3">{errorMsg}</p>}

        {!loading && !errorMsg && news.length === 0 && (
          <p className="text-sm text-gray-500">
            Пока нет новостей по твоим предпочтениям.
          </p>
        )}

        <div className="space-y-4">
          {news.map((item) => (
            <NewsCard key={item.url} item={item} />
          ))}
        </div>
      </section>

      <aside className="bg-white p-4 rounded shadow space-y-3">
        <h4 className="font-semibold">Подсказка</h4>
        <p className="text-sm text-gray-600">
          Лента формируется по твоему профилю: горизонт, риск, интересующие сектора/акции.
        </p>

        <div className="text-xs text-gray-600 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>Позитивно: может поддержать цены/настроения</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            <span>Нейтрально: без явного эффекта</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>Негативно: риск давления на рынок/акции</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
