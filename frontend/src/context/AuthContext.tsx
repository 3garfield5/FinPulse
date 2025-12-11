// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  /** флаг: уже прочитали состояние из localStorage и инициализировались */
  isAuthReady: boolean;
  setTokens: (tokens: Tokens) => void;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false); // <-- новый флаг

  // Инициализация из localStorage при первой загрузке
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_tokens");
      if (stored) {
        const parsed: Tokens = JSON.parse(stored);
        if (parsed.accessToken) {
          setAccessToken(parsed.accessToken);
          setRefreshToken(parsed.refreshToken);
          setIsAuthenticated(true);
        } else {
          setAccessToken(null);
          setRefreshToken(null);
          setIsAuthenticated(false);
        }
      } else {
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      // На всякий случай чистим при кривых данных
      console.error("Ошибка чтения auth_tokens из localStorage:", e);
      localStorage.removeItem("auth_tokens");
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthReady(true); // <-- говорим, что инициализация завершена
    }
  }, []);

  const setTokens = (newTokens: Tokens) => {
    setAccessToken(newTokens.accessToken);
    setRefreshToken(newTokens.refreshToken);

    if (newTokens.accessToken) {
      localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("auth_tokens");
      setIsAuthenticated(false);
    }
  };

  const logout = () => {
    setTokens({ accessToken: null, refreshToken: null });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
        isAuthReady,
        setTokens,
        setIsAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
