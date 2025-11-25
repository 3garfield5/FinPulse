import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { getMetaOptions } from "../api/meta";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [markets, setMarkets] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const navigate = useNavigate();

  // Загружаем доступные markets / categories
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const data = await getMetaOptions();
        setAvailableMarkets(data.markets);
        setAvailableCategories(data.categories);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить списки рынков и категорий");
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const toggleMarket = (value: string) => {
    setMarkets((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  };

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      await registerUser({
        name,
        email,
        password,
        markets,
        categories,
      });

      navigate("/login");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Ошибка регистрации";
      setError(detail);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Регистрация</h2>

      <form onSubmit={submit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm mb-1">Имя</label>
          <input
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
          <label className="block text-sm mb-1">Подтверждение пароля</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Маркеты */}
        <div>
          <label className="block text-sm mb-1">Рынки</label>
          {loadingOptions && (
            <p className="text-xs text-gray-500">Загружаем варианты…</p>
          )}
          {!loadingOptions && availableMarkets.length === 0 && (
            <p className="text-xs text-gray-500">
              Нет доступных рынков (проверь /meta/options)
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {availableMarkets.map((m) => (
              <label
                key={m}
                className="flex items-center gap-1 text-sm border rounded px-2 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={markets.includes(m)}
                  onChange={() => toggleMarket(m)}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Категории */}
        <div>
          <label className="block text-sm mb-1">Категории новостей</label>
          {loadingOptions && (
            <p className="text-xs text-gray-500">Загружаем варианты…</p>
          )}
          {!loadingOptions && availableCategories.length === 0 && (
            <p className="text-xs text-gray-500">
              Нет доступных категорий (проверь /meta/options)
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {availableCategories.map((c) => (
              <label
                key={c}
                className="flex items-center gap-1 text-sm border rounded px-2 py-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(c)}
                  onChange={() => toggleCategory(c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Зарегистрироваться
          </button>
        </div>
      </form>
    </div>
  );
}
