import React, { useState } from 'react'
import Preferences from '../components/Preferences'

type PrefsType = { markets: string[]; categories: string[] }

export default function Profile(){
  const [prefs, setPrefs] = useState<PrefsType>({ markets:['Россия','США'], categories:['Акции','Криптовалюта'] })

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white p-4 rounded shadow">
        <h3 className="font-semibold">Личный кабинет</h3>
        <p className="text-sm text-gray-600">Матвей</p>
        <p className="text-sm text-gray-600">matveykakozyrev@gmail.com</p>
        <div className="mt-4">
          <h4 className="font-medium">Предпочтительные рынки</h4>
          <div className="flex gap-2 mt-2">
            {prefs.markets.map(m=>(<span key={m} className="px-2 py-1 bg-gray-100 rounded">{m}</span>))}
          </div>
        </div>
      </div>
      <aside>
        <Preferences prefs={prefs} setPrefs={setPrefs} />
      </aside>
    </div>
  )
}
