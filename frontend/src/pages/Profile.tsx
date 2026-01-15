import React, { useEffect, useState } from "react";
import ProfileForm from "../components/Preferences";
import { MARKET_LABELS, HORIZON_LABELS, EXPERIENCE_LABELS, RISK_LABELS, SECTOR_LABELS } from "../constants/dicts";
import { getProfile, updateProfile, ProfileData, ProfileUpdatePayload } from "../api/profile";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileUpdatePayload>({
    investment_horizon: null,
    experience_level: null,
    risk_level: null,
    tickers: [],
    sectors: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setDraft({
          investment_horizon: data.investment_horizon ?? null,
          experience_level: data.experience_level ?? null,
          risk_level: data.risk_level ?? null,
          tickers: data.tickers ?? [],
          sectors: data.sectors ?? [],
        });
      } catch (err) {
        console.error("Ошибка загрузки профиля", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async (payload: ProfileUpdatePayload) => {
    try {
      setSaving(true);
      const updated = await updateProfile(payload);
      setProfile(updated);
      setDraft({
        investment_horizon: updated.investment_horizon ?? null,
        experience_level: updated.experience_level ?? null,
        risk_level: updated.risk_level ?? null,
        tickers: updated.tickers ?? [],
        sectors: updated.sectors ?? [],
      });
      alert("Профиль сохранён");
    } catch (err) {
      console.error("Ошибка сохранения профиля", err);
      alert("Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Загрузка профиля...</div>;
  if (!profile) return <div>Не удалось загрузить профиль</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Личный кабинет</h3>
        <p className="text-sm text-gray-600">{profile.name}</p>
        <p className="text-sm text-gray-600">{profile.email}</p>

        <div className="mt-4">
          <h4 className="font-medium">Рынок</h4>
          <div className="mt-2">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {MARKET_LABELS[profile.market] ?? profile.market}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium">Профиль</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.investment_horizon && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {HORIZON_LABELS[profile.investment_horizon] ?? profile.investment_horizon}
              </span>
            )}
            {profile.experience_level && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {EXPERIENCE_LABELS[profile.experience_level] ?? profile.experience_level}
              </span>
            )}
            {profile.risk_level && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {RISK_LABELS[profile.risk_level] ?? profile.risk_level}
              </span>
            )}
            {!profile.investment_horizon && !profile.experience_level && !profile.risk_level && (
              <span className="text-sm text-gray-500">Пока не заполнен</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium">Интересующие акции</h4>
          <div className="flex gap-2 mt-2 flex-wrap">
            {(profile.tickers ?? []).length > 0 ? (
              profile.tickers.map((t) => (
                <span key={t} className="px-2 py-1 bg-gray-100 rounded">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Не указаны</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium">Интересующие сектора</h4>
          <div className="flex gap-2 mt-2 flex-wrap">
            {(profile.sectors ?? []).length > 0 ? (
              profile.sectors.map((s) => (
                <span key={s} className="px-2 py-1 bg-gray-100 rounded">
                  {SECTOR_LABELS[s] ?? s}
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">Не указаны</span>
            )}
          </div>
        </div>
      </div>

      <aside>
        <ProfileForm
          investment_horizon={draft.investment_horizon ?? null}
          experience_level={draft.experience_level ?? null}
          risk_level={draft.risk_level ?? null}
          tickers={draft.tickers ?? []}
          sectors={draft.sectors ?? []}
          onChange={(next) => setDraft((prev) => ({ ...prev, ...next }))}
          onSave={(payload) => handleSave(payload)}
        />
        {saving && <p className="text-xs text-gray-500 mt-2">Сохраняем профиль...</p>}
      </aside>
    </div>
  );
}
