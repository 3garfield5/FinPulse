type InvestmentHorizon = "short" | "mid" | "long";
type ExperienceLevel = "beginner" | "intermediate" | "pro";
type RiskLevel = "low" | "medium" | "high";

type ProfilePayload = {
  investment_horizon?: InvestmentHorizon | null;
  experience_level?: ExperienceLevel | null;
  risk_level?: RiskLevel | null;
  tickers?: string[];
  sectors?: string[];
};

type ProfileFormProps = {
  investment_horizon: InvestmentHorizon | null;
  experience_level: ExperienceLevel | null;
  risk_level: RiskLevel | null;
  tickers: string[];
  sectors: string[];
  onChange: (next: Partial<ProfilePayload>) => void;
  onSave: (payload: ProfilePayload) => void;
};

const SECTOR_LABELS: Record<string, string> = {
  banks: "Банки",
  oil_gas: "Нефть и газ",
  metals_mining: "Металлы и добыча",
  it: "IT",
  consumer: "Потребительский сектор",
  telecom: "Телеком",
  utilities: "Электроэнергетика",
  real_estate: "Недвижимость",
  transport: "Транспорт",
  industrials: "Промышленность",
  financials_other: "Финансы (прочее)",
};

const HORIZON_LABELS: Record<InvestmentHorizon, string> = {
  short: "Краткосрочный (дни–недели)",
  mid: "Среднесрочный (месяцы)",
  long: "Долгосрочный (годы)",
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Новичок",
  intermediate: "Опытный",
  pro: "Профессионал",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

function normalizeTicker(input: string) {
  return input.trim().toUpperCase();
}

export default function ProfileForm({
  investment_horizon,
  experience_level,
  risk_level,
  tickers,
  sectors,
  onChange,
  onSave,
}: ProfileFormProps) {
  const toggleSector = (value: string) => {
    if (sectors.includes(value)) {
      onChange({ sectors: sectors.filter((s) => s !== value) });
    } else {
      onChange({ sectors: [...sectors, value] });
    }
  };

  const addTicker = (raw: string) => {
    const t = normalizeTicker(raw);
    if (!t) return;

    if (tickers.includes(t)) return;
    onChange({ tickers: [...tickers, t] });
  };

  const removeTicker = (t: string) => {
    onChange({ tickers: tickers.filter((x) => x !== t) });
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Профиль FinPulse</h3>

      {/* Рынок фиксированный */}
      <div className="mb-4">
        <div className="text-sm text-gray-500">Рынок</div>
        <div className="font-medium">🇷🇺 Россия</div>
      </div>

      {/* Горизонт */}
      <div className="mb-4">
        <div className="font-medium mb-2">Горизонт инвестирования</div>
        <select
          className="w-full border rounded px-3 py-2"
          value={investment_horizon ?? ""}
          onChange={(e) =>
            onChange({
              investment_horizon: (e.target.value || null) as InvestmentHorizon | null,
            })
          }
        >
          <option value="">Не выбран</option>
          <option value="short">{HORIZON_LABELS.short}</option>
          <option value="mid">{HORIZON_LABELS.mid}</option>
          <option value="long">{HORIZON_LABELS.long}</option>
        </select>
      </div>

      {/* Опыт */}
      <div className="mb-4">
        <div className="font-medium mb-2">Уровень опыта</div>
        <select
          className="w-full border rounded px-3 py-2"
          value={experience_level ?? ""}
          onChange={(e) =>
            onChange({
              experience_level: (e.target.value || null) as ExperienceLevel | null,
            })
          }
        >
          <option value="">Не выбран</option>
          <option value="beginner">{EXPERIENCE_LABELS.beginner}</option>
          <option value="intermediate">{EXPERIENCE_LABELS.intermediate}</option>
          <option value="pro">{EXPERIENCE_LABELS.pro}</option>
        </select>
      </div>

      {/* Риск */}
      <div className="mb-4">
        <div className="font-medium mb-2">Уровень риска</div>
        <select
          className="w-full border rounded px-3 py-2"
          value={risk_level ?? ""}
          onChange={(e) =>
            onChange({
              risk_level: (e.target.value || null) as RiskLevel | null,
            })
          }
        >
          <option value="">Не выбран</option>
          <option value="low">{RISK_LABELS.low}</option>
          <option value="medium">{RISK_LABELS.medium}</option>
          <option value="high">{RISK_LABELS.high}</option>
        </select>
      </div>

      {/* Тикеры */}
      <div className="mb-4">
        <div className="font-medium mb-2">Интересующие акции (тикеры)</div>
        <TickerInput
          onAdd={addTicker}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {tickers.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm"
            >
              {t}
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => removeTicker(t)}
                aria-label={`Удалить ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          {tickers.length === 0 && (
            <div className="text-sm text-gray-500">Можно пропустить</div>
          )}
        </div>
      </div>

      {/* Сектора */}
      <div className="mb-4">
        <div className="font-medium mb-2">Интересующие сектора</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(SECTOR_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sectors.includes(key)}
                onChange={() => toggleSector(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() =>
          onSave({
            investment_horizon,
            experience_level,
            risk_level,
            tickers,
            sectors,
          })
        }
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Сохранить профиль
      </button>
    </div>
  );
}

function TickerInput({ onAdd }: { onAdd: (t: string) => void }) {
  return (
    <input
      className="w-full border rounded px-3 py-2"
      placeholder="Например: SBER, GAZP, LKOH (нажми Enter)"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const value = (e.target as HTMLInputElement).value;
          onAdd(value);
          (e.target as HTMLInputElement).value = "";
        }
      }}
    />
  );
}
