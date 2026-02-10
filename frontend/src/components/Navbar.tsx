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
      (isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100")
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  const { auth, hasPermission, hasRole, logout } = useAuth();

  const isLoading = auth.status === "loading";
  const isAuthed = auth.status === "authenticated";

  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow">
      <div className="flex items-center gap-3">
        <NavLink to="/" className="text-2xl font-bold text-blue-600">
          FinPulse
        </NavLink>
        <span className="text-sm text-gray-500">AI-ассистент для трейдеров</span>
      </div>

      <div className="flex gap-3 items-center">
        {isLoading ? null : isAuthed ? (
          <>
            {hasPermission("chat:use") && <Link to="/chat">Чат</Link>}
            {hasPermission("news:list") && <Link to="/news">Новости</Link>}
            {hasPermission("profile:read_own") && <Link to="/profile">Профиль</Link>}

            {hasRole("admin") && <Link to="/admin/users">Admin</Link>}

            <button
              onClick={logout}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
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
  );
}