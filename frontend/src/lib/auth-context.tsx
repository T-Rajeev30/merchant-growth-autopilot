"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/utils";
import { setCsrfToken } from "@/lib/csrf";

export interface AuthUser { id: string; email: string; }
interface AuthValue { user: AuthUser | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (invite: string, password: string) => Promise<void>; acceptInvitation: (invite: string) => Promise<void>; logout: () => Promise<void>; }
const AuthContext = createContext<AuthValue>({ user: null, loading: true, login: async () => {}, register: async () => {}, acceptInvitation: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<{ user: AuthUser; csrfToken: string }>("/api/auth/session").then((result) => { if (active) { setUser(result.user); setCsrfToken(result.csrfToken); } })
      .catch(() => { if (active) { setUser(null); setCsrfToken(null); } })
      .finally(() => { if (active) setLoading(false); });
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => { active = false; window.removeEventListener("auth:expired", onExpired); };
  }, []);

  async function login(email: string, password: string) {
    const result = await api<{ user: AuthUser; csrfToken: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setUser(result.user);
    setCsrfToken(result.csrfToken);
  }
  async function register(invite: string, password: string) {
    const result = await api<{ user: AuthUser; csrfToken: string }>("/api/auth/register", { method: "POST", body: JSON.stringify({ invite, password }) });
    setUser(result.user);
    setCsrfToken(result.csrfToken);
  }
  async function acceptInvitation(invite: string) {
    await api("/api/auth/accept-invitation", { method: "POST", body: JSON.stringify({ invite }) });
  }
  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); } finally { setUser(null); setCsrfToken(null); }
  }
  return <AuthContext.Provider value={{ user, loading, login, register, acceptInvitation, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
