import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCsrfToken } from "@/lib/csrf";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const merchantId = localStorage.getItem("active-merchant-id");
    if (merchantId) headers.set("x-merchant-id", merchantId);
    if (options?.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())) {
      const csrf = getCsrfToken() ?? document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("mga_csrf="))?.slice("mga_csrf=".length);
      if (csrf) headers.set("x-csrf-token", decodeURIComponent(csrf));
    }
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
    window.dispatchEvent(new Event("auth:expired"));
  }
  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) msg = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
