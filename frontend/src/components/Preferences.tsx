import React from 'react'

type PreferencesProps = {
  prefs: { markets: string[]; categories: string[] }
  setPrefs: React.Dispatch<React.SetStateAction<{ markets: string[]; categories: string[] }>>
}

export default function Preferences({prefs, setPrefs}: PreferencesProps){
  const markets = ['Россия','США','Европа','Азия']
  const categories = ['Макроэкономика','Акции','Валюта','Криптовалюта','Сырьевой товар']

  const toggle = (field: 'markets' | 'categories', value: string) => {
    const arr = prefs[field]
    if(arr.includes(value)) setPrefs({...prefs, [field]: arr.filter(x=>x!==value)})
    else setPrefs({...prefs, [field]: [...arr, value]})
  }

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <h4 className="font-semibold mb-2">Предпочтения</h4>
      <div className="mb-3">
        <div className="text-sm font-medium mb-1">Рынки</div>
        <div className="flex flex-wrap gap-2">
          {markets.map(m => (
            <button key={m} onClick={()=>toggle('markets', m)} className={`px-2 py-1 text-sm rounded ${prefs.markets.includes(m) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium mb-1">Категории</div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={()=>toggle('categories', c)} className={`px-2 py-1 text-sm rounded ${prefs.categories.includes(c) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}