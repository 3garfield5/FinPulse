import React, { useState } from 'react'
import Message from '../components/Message'

type MessageType = { id: number; author: string; text: string; time: string; isBot: boolean }

export default function Chat(){
  const [messages, setMessages] = useState<MessageType[]>([
    {id:1, author:'FinPulse', text:'Привет! Чем могу помочь?', time:'только что', isBot:true},
    {id:2, author:'Пользователь', text:'Какие новости по SBER?', time:'только что', isBot:false}
  ])
  const [text, setText] = useState<string>('')

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if(!text.trim()) return
    setMessages([...messages, {id:Date.now(), author:'Пользователь', text, time:'только что', isBot:false}])
    setText('')
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-white p-4 rounded shadow h-[68vh] flex flex-col">
        <div className="overflow-auto mb-4 flex-1 space-y-2">
          {messages.map(m => <Message key={m.id} {...m} />)}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input 
            value={text} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)} 
            placeholder="Сообщение..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Отправить</button>
        </form>
      </div>
      <aside className="bg-white p-4 rounded shadow">
        <h4 className="font-semibold mb-2">Последние уведомления</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>AAPL выросла на 3.2%</li>
          <li>SBER вырос на 4 пункта!</li>
          <li>Bitcoin +5.8%</li>
        </ul>
      </aside>
    </div>
  )
}