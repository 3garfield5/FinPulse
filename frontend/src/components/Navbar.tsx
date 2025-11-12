import { NavLink, NavLinkProps } from 'react-router-dom'

type LinkProps = NavLinkProps & {
  children: React.ReactNode
}

const Link = ({ to, children, ...props }: LinkProps) => (
  <NavLink
    to={to}
    {...props}
    className={({ isActive }) =>
      'px-3 py-2 rounded-md text-sm font-medium ' +
      (isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')
    }
  >
    {children}
  </NavLink>
)


import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth()

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <div className="flex items-center gap-3">
        <div  className="text-2xl font-bold text-blue-600">
                  <a href='/'>FinPulse</a>
        </div>
        <span className="text-sm text-gray-500">Умный чат-бот для трейдеров</span>
      </div>
      
      <div className="flex gap-3">
        {isLoggedIn ? (
          <>
              <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <nav className="flex items-center gap-2">
                  <Link to="/chat">Чат</Link>
                  <Link to="/news">Новости</Link>
                  <Link to="/profile">Профиль</Link>
                </nav>
              </div>
            <button 
              onClick={logout} 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700"
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">
              Войти
            </Link>
            <Link to="/register" className="px-4 py-2 border rounded">
              Зарегистрироваться
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

