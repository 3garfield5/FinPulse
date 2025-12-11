import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { MARKET_LABELS, CATEGORY_LABELS } from "../constants/dicts";

type MetaOptions = {
  markets: string[];
  categories: string[];
};

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [options, setOptions] = useState<MetaOptions>({
    markets: [],
    categories: [],
  });

  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1) подтягиваем разрешённые markets/categories с бэка
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await api.get<MetaOptions>("/meta/options");
        setOptions(res.data);
      } catch (err) {
        console.error("Ошибка загрузки /meta/options", err);
        setErrorMsg("Не удалось загрузить настройки рынков и категорий");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const toggleMarket = (code: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code]
    );
  };

  const toggleCategory = (code: string) => {
    setSelectedCategories((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      setErrorMsg("Пароли не совпадают");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Введите имя");
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        markets: selectedMarkets,       // ← EN-коды, как ждёт бэк
        categories: selectedCategories, // ← EN-коды, как ждёт бэк
      });

      // после успешной регистрации — на логин
      navigate("/login");
    } catch (err: any) {
      console.error("Ошибка регистрации", err);
      // пробуем вытащить detail из ответа FastAPI
      const detail =
        err?.response?.data?.detail ||
        "Не удалось зарегистрироваться. Попробуйте ещё раз.";
      setErrorMsg(
        Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join("; ")
          : String(detail)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Регистрация</h2>

      {errorMsg && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Почта</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Подтвердите пароль</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Рынки */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Предпочтительные рынки
          </label>
          {loadingOptions ? (
            <p className="text-sm text-gray-500">Загружаю доступные рынки…</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {options.markets.map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMarkets.includes(code)}
                    onChange={() => toggleMarket(code)}
                  />
                  <span>{MARKET_LABELS[code] ?? code}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Категории */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Предпочтительные категории новостей
          </label>
          {loadingOptions ? (
            <p className="text-sm text-gray-500">
              Загружаю доступные категории…
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {options.categories.map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(code)}
                    onChange={() => toggleCategory(code)}
                  />
                  <span>{CATEGORY_LABELS[code] ?? code}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {submitting ? "Регистрирую…" : "Зарегистрироваться"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
