// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthToken, setAuthToken, api } from "../api";

type AuthState = {
  token: string | null;
  login: (nickname: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getAuthToken());

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  async function login(nickname: string, password: string) {
    const res = await api.login({ nickname, password });
    setToken(res.token);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("uid");
  }

  return (
    <Ctx.Provider value={{ token, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider/>");
  return ctx;
}
