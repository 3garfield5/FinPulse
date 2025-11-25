import { Routes, Route } from 'react-router-dom'

import Landing from './pages/Landing'
import Chat from './pages/Chat'
import News from './pages/News'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <News />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </AuthProvider>
  )
}
