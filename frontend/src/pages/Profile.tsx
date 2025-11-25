import React, { useEffect, useState } from "react";
import Preferences from "../components/Preferences";
import { MARKET_LABELS, CATEGORY_LABELS } from "../constants/dicts";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client"; // путь поправь, если у тебя другой

type PrefsState = {
  markets: string[];
  categories: string[];
};

type ProfileResponse = {
  name: string;
  email: string;
  markets: string[];
  categories: string[];
};

export default function Profile() {
  const { accessToken } = useAuth();
  const [prefs, setPrefs] = useState<PrefsState>({
    markets: [],
    categories: [],
  });
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const availableMarkets = ["russia", "usa", "europe", "asia"];
  const availableCategories = ["macro", "stocks", "fx", "crypto", "commodities"];

  // подтягиваем профиль из БД
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get<ProfileResponse>("/profile", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = res.data;
        setName(data.name);
        setEmail(data.email);
        setPrefs({
          markets: data.markets ?? [],
          categories: data.categories ?? [],
        });
      } catch (err) {
        console.error("Ошибка загрузки профиля", err);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      loadProfile();
    }
  }, [accessToken]);

  const handleSavePrefs = async () => {
    try {
      setSaving(true);
      await api.patch(
        "/profile/preferences", // или тот путь, который у тебя в бэке
        {
          markets: prefs.markets,
          categories: prefs.categories,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      // можно вывести тост/alert
      alert("Настройки сохранены");
    } catch (err) {
      console.error("Ошибка сохранения настроек", err);
      alert("Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Личный кабинет</h3>
        <p className="text-sm text-gray-600">{name}</p>
        <p className="text-sm text-gray-600">{email}</p>

        <div className="mt-4">
          <h4 className="font-medium">Предпочтительные рынки</h4>
          <div className="flex gap-2 mt-2 flex-wrap">
            {prefs.markets.map((m) => (
              <span key={m} className="px-2 py-1 bg-gray-100 rounded">
                {MARKET_LABELS[m] ?? m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium">Предпочтительные категории</h4>
          <div className="flex gap-2 mt-2 flex-wrap">
            {prefs.categories.map((c) => (
              <span key={c} className="px-2 py-1 bg-gray-100 rounded">
                {CATEGORY_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <aside>
        <Preferences
          markets={prefs.markets}
          categories={prefs.categories}
          availableMarkets={availableMarkets}
          availableCategories={availableCategories}
          onChangeMarkets={(next) =>
            setPrefs((prev) => ({ ...prev, markets: next }))
          }
          onChangeCategories={(next) =>
            setPrefs((prev) => ({ ...prev, categories: next }))
          }
          onSave={handleSavePrefs}
        />
        {saving && (
          <p className="text-xs text-gray-500 mt-2">Сохраняем настройки...</p>
        )}
      </aside>
    </div>
  );
}
