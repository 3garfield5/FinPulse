import { NavLink, NavLinkProps } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type LinkProps = NavLinkProps & {
  children: React.ReactNode;
};

const Link = ({ to, children, ...props }: LinkProps) => (
  <NavLink
    to={to}
    {...props}
    className={({ isActive }) =>
      "px-3 py-2 rounded-md text-sm font-medium " +
      (isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100")
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      {/* Лого */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-2xl font-bold text-blue-600">
          FinPulse
        </a>
        <span className="text-sm text-gray-500">
          Умный чат-бот для трейдеров
        </span>
      </div>

      {/* Навигация */}
      <div className="flex gap-3">
        {isAuthenticated ? (
          <>
            <Link to="/chat">Чат</Link>
            <Link to="/news">Новости</Link>
            <Link to="/profile">Профиль</Link>

            <button
              onClick={() => logout()}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 border rounded"
            >
              Зарегистрироваться
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
