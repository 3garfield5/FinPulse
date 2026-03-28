import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SeoHead from "../components/SeoHead";
import { getPublicNewsItemBySlug, NewsItem } from "../api/news";

const NewsCard = React.lazy(() => import("../components/NewsCard"));
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

export default function PublicNewsItem() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getPublicNewsItemBySlug(slug);
        setItem(data);
      } catch (err: any) {
        console.error("Ошибка загрузки публичной новости", err);
        setErrorMsg(err?.response?.status === 404 ? "Новость не найдена." : "Ошибка загрузки новости.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [slug]);

  const structuredData = useMemo(() => {
    if (!item) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: item.title,
      datePublished: item.asof ?? undefined,
      articleBody: item.summary,
      mainEntityOfPage: `${SITE_URL}/news/public/${item.slug}`,
      publisher: {
        "@type": "Organization",
        name: "FinPulse",
      },
    };
  }, [item]);

  return (
    <>
      <SeoHead
        title={item ? `${item.title} | FinPulse` : "Новость | FinPulse"}
        description={item?.summary || "Аналитическая карточка новости российского фондового рынка."}
        canonicalPath={`/news/public/${slug ?? ""}`}
        type="article"
        structuredData={structuredData}
      />

      <section className="max-w-4xl mx-auto bg-white p-4 rounded shadow space-y-4">
        <Link to="/news/public" className="text-sm text-blue-600 hover:underline">
          ← Вернуться к публичной ленте
        </Link>

        {loading && <p className="text-sm text-gray-500">Загружаю новость...</p>}
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {!loading && !errorMsg && item && (
          <Suspense fallback={<p className="text-sm text-gray-500">Подгружаю карточку...</p>}>
            <NewsCard item={item} />
          </Suspense>
        )}
      </section>
    </>
  );
}
