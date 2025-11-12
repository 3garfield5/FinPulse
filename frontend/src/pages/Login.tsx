import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/profile')
  }

  const { login } = useAuth()

  const handleLogin = () => {
    login()
    navigate('/profile')
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Войти</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm">Почта</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm">Пароль</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleLogin} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Войти</button>
        </div>
      </form>
    </div>
  )
}