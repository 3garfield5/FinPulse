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

  // подтягиваем состояние из localStorage при первой загрузке
  useEffect(() => {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const parsed: Tokens = JSON.parse(stored);
      if (parsed.accessToken) {
        setAccessToken(parsed.accessToken);
        setRefreshToken(parsed.refreshToken);
        setIsAuthenticated(true);
      }
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
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        refreshToken,
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
