import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, Me } from "../api/me";
import { clearTokens, getAccessToken, setTokens as storeTokens } from "../api/client";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; me: Me };

type Tokens = { accessToken: string; refreshToken: string };

type AuthContextType = {
  auth: AuthState;
  isAuthReady: boolean;
  me: Me | null;

  // actions
  login: (tokens: Tokens) => Promise<void>;
  logout: () => void;
  reload: () => Promise<void>;

  // helpers
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const isAuthReady = auth.status !== "loading";
  const me = auth.status === "authenticated" ? auth.me : null;

  async function loadMe() {
    const token = getAccessToken();
    if (!token) {
      setAuth({ status: "anonymous" });
      return;
    }
    try {
      const me = await getMe();
      setAuth({ status: "authenticated", me });
    } catch {
      clearTokens();
      setAuth({ status: "anonymous" });
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  async function login(tokens: Tokens) {
    storeTokens(tokens.accessToken, tokens.refreshToken);
    await loadMe();
  }

  function logout() {
    clearTokens();
    setAuth({ status: "anonymous" });
  }

  async function reload() {
    await loadMe();
  }

  function hasPermission(perm: string) {
    if (!me) return false;
    return me.permissions.includes(perm);
  }

  function hasRole(role: string) {
    if (!me) return false;
    return me.roles.includes(role);
  }

  const value = useMemo<AuthContextType>(
    () => ({
      auth,
      isAuthReady,
      me,
      login,
      logout,
      reload,
      hasPermission,
      hasRole,
    }),
    [auth, isAuthReady, me]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}