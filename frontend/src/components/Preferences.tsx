import { MARKET_LABELS, CATEGORY_LABELS } from "../constants/dicts";

type PreferencesProps = {
  markets: string[];
  categories: string[];
  availableMarkets: string[];
  availableCategories: string[];
  onChangeMarkets: (next: string[]) => void;
  onChangeCategories: (next: string[]) => void;
  onSave: () => void;
};

export default function Preferences({
  markets,
  categories,
  availableMarkets,
  availableCategories,
  onChangeMarkets,
  onChangeCategories,
  onSave,
}: PreferencesProps) {
  const toggle = (
    current: string[],
    value: string,
    setter: (next: string[]) => void,
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-xl font-semibold mb-4">Настройки предпочтений</h3>

      <h4 className="font-medium mb-2">Рынки</h4>
      {availableMarkets.map((m) => (
        <label key={m} className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={markets.includes(m)}
            onChange={() => toggle(markets, m, onChangeMarkets)}
          />
          <span>{MARKET_LABELS[m] ?? m}</span>
        </label>
      ))}

      <h4 className="font-medium mt-4 mb-2">Категории</h4>
      {availableCategories.map((c) => (
        <label key={c} className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={categories.includes(c)}
            onChange={() => toggle(categories, c, onChangeCategories)}
          />
          <span>{CATEGORY_LABELS[c] ?? c}</span>
        </label>
      ))}

      <button
        onClick={onSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Сохранить настройки
      </button>
    </div>
  );
}
