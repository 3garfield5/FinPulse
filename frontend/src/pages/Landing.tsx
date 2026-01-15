import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <section className="grid md:grid-cols-2 gap-8 items-start max-w-5xl w-full px-6">
        
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            FinPulse — AI-ассистент для трейдеров и инвесторов российского фондового рынка
          </h1>
          <p className="text-gray-700 mb-6 leading-relaxed">
            FinPulse объясняет, как события в России влияют на рынок и акции — простым языком.
          </p>

          <div className="flex gap-3">
            <Link 
              to="/chat" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              AI-ассистент
            </Link>
            <Link 
              to="/news" 
              className="px-6 py-3 border rounded-lg text-blue-600 border-blue-600 hover:bg-blue-50 transition"
            >
              Читать новости
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="font-semibold mb-3 text-gray-800">Что вы получаете каждый день</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>• 3–5 ключевых событий рынка РФ</div>
            <div>• Короткое объяснение «что это значит»</div>
            <div>• Подсветка рисков и неопределённостей</div>
            <div>• Контекст по рынку, сектору или акции</div>
          </div>
        </div>
      </section>
    </div>
  )
}
