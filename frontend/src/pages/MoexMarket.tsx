import React, { useEffect, useMemo, useState } from "react";

import SeoHead from "../components/SeoHead";
import { getImoexQuotes, MoexQuote } from "../api/moex";

function fmt(v: number | null, digits = 2) {
  if (v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function MoexMarket() {
  const [items, setItems] = useState<MoexQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await getImoexQuotes(12);
        setItems(data.items);
        setFallback(data.fallback);
        setFetchedAt(data.fetched_at);
      } catch (err) {
        console.error(err);
        setErrorMsg("Не удалось загрузить котировки MOEX.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const updatedLabel = useMemo(() => {
    if (!fetchedAt) return "—";
    return new Date(fetchedAt).toLocaleString("ru-RU");
  }, [fetchedAt]);

  return (
    <>
      <SeoHead
        title="Котировки IMOEX | FinPulse"
        description="Публичная страница котировок акций из корзины индекса Московской биржи (IMOEX)."
        canonicalPath="/market/moex"
      />
      <section className="max-w-5xl mx-auto bg-white p-4 rounded shadow space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Котировки IMOEX</h1>
          <p className="text-sm text-gray-600 mt-1">
            Акции из базового набора индекса МосБиржи. Обновлено: {updatedLabel}
          </p>
        </header>

        {fallback && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Внешний API MOEX временно недоступен, показан fallback-список тикеров без цен.
          </p>
        )}

        {loading && <p className="text-sm text-gray-500">Загрузка котировок...</p>}
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        {!loading && !errorMsg && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="py-2 pr-3">Тикер</th>
                  <th className="py-2 pr-3">Компания</th>
                  <th className="py-2 pr-3">Цена</th>
                  <th className="py-2 pr-3">Изм.</th>
                  <th className="py-2 pr-3">Изм. %</th>
                  <th className="py-2 pr-3">Время</th>
                </tr>
              </thead>
              <tbody>
                {items.map((q) => {
                  const positive = (q.change ?? 0) > 0;
                  const negative = (q.change ?? 0) < 0;
                  return (
                    <tr key={q.ticker} className="border-b">
                      <td className="py-2 pr-3 font-medium">{q.ticker}</td>
                      <td className="py-2 pr-3">{q.short_name || "—"}</td>
                      <td className="py-2 pr-3">{fmt(q.last)}</td>
                      <td className={`py-2 pr-3 ${positive ? "text-green-700" : negative ? "text-red-700" : ""}`}>
                        {fmt(q.change)}
                      </td>
                      <td className={`py-2 pr-3 ${positive ? "text-green-700" : negative ? "text-red-700" : ""}`}>
                        {fmt(q.change_percent)}
                      </td>
                      <td className="py-2 pr-3">{q.update_time || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
