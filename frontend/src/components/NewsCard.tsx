import React from "react";
import type { NewsItem, Impact, Confidence } from "../api/news";

type Props = {
  item: NewsItem;
};

const IMPACT_LABELS: Record<Impact, string> = {
  positive: "Позитив",
  neutral: "Нейтрал",
  negative: "Негатив",
};

const IMPACT_BADGE: Record<Impact, string> = {
  positive: "bg-green-100 text-green-800 border-green-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  negative: "bg-red-100 text-red-800 border-red-200",
};

const CONF_LABELS: Record<Confidence, string> = {
  low: "низкая",
  medium: "средняя",
  high: "высокая",
};

const CONF_BADGE: Record<Confidence, string> = {
  low: "bg-gray-50 text-gray-700 border-gray-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-purple-50 text-purple-700 border-purple-200",
};

// MVP: важность можно приравнять к confidence (пока нет отдельного поля importance)
const IMPORTANCE_LABELS: Record<Confidence, string> = {
  low: "низкая важность",
  medium: "средняя важность",
  high: "высокая важность",
};

export default function NewsCard({ item }: Props) {
  const ind = item.indicator;

  const bullets = (item.bullets ?? []).filter(Boolean).slice(0, 6);
  const risks = (item.risks ?? []).filter(Boolean).slice(0, 6);

  return (
    <article className="bg-white p-4 rounded-lg border shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg leading-snug break-words">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{item.source}</p>
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 whitespace-nowrap hover:underline"
        >
          Источник
        </a>
      </div>

      {/* badges */}
      {ind && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`text-xs px-2 py-1 rounded border ${IMPACT_BADGE[ind.impact]}`}
            title="Общее влияние новости на рынок/сектор"
          >
            {IMPACT_LABELS[ind.impact]}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded border ${CONF_BADGE[ind.confidence]}`}
            title="Насколько уверенно модель оценивает вывод"
          >
            Уверенность: {CONF_LABELS[ind.confidence]}
          </span>

          <span
            className={`text-xs px-2 py-1 rounded border ${CONF_BADGE[ind.confidence]}`}
            title="Насколько это стоит внимания (MVP: равно уверенности)"
          >
            {IMPORTANCE_LABELS[ind.confidence]}
          </span>
        </div>
      )}

      {/* summary */}
      {item.summary && (
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">
          {item.summary}
        </p>
      )}

      {/* bullets */}
      {bullets.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Ключевые факты
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {bullets.map((b, i) => (
              <li key={i} className="leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* conclusion */}
      {item.conclusion && (
        <div className="mt-3 p-3 rounded bg-gray-50 border">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Вывод
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">
            {item.conclusion}
          </p>
        </div>
      )}

      {/* rationale */}
      {ind?.rationale?.length ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Почему такой индикатор?
          </summary>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
            {ind.rationale.slice(0, 6).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {/* risks */}
      {risks.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-red-700 hover:text-red-800">
            Риски ({risks.length})
          </summary>
          <div className="mt-2 p-3 rounded bg-red-50 border border-red-100">
            <ul className="list-disc pl-5 space-y-1 text-red-800">
              {risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </article>
  );
}
