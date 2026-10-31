"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/utils";

export interface MerchantSummary {
  id: string;
  name: string;
  businessType: string;
  city: string;
  address?: string;
  dataMode: "simulated" | "live";
}

interface MerchantContextValue {
  merchants: MerchantSummary[];
  activeMerchant: MerchantSummary | null;
  activeMerchantId: string | null;
  loading: boolean;
  error: string | null;
  setActiveMerchantId: (id: string) => void;
  updateMerchant: (merchant: MerchantSummary) => void;
}

const STORAGE_KEY = "active-merchant-id";
const MerchantContext = createContext<MerchantContextValue>({
  merchants: [],
  activeMerchant: null,
  activeMerchantId: null,
  loading: true,
  error: null,
  setActiveMerchantId: () => {},
  updateMerchant: () => {},
});

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [activeMerchantId, setActiveMerchantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMerchants() {
      try {
        const result = await api<{ merchants: MerchantSummary[] }>("/api/merchants");
        if (cancelled) return;
        setMerchants(result.merchants);

        const savedId = localStorage.getItem(STORAGE_KEY);
        const savedMerchant = result.merchants.find((merchant) => merchant.id === savedId);
        const chosen = savedMerchant ?? result.merchants[0] ?? null;
        if (chosen) {
          localStorage.setItem(STORAGE_KEY, chosen.id);
          setActiveMerchantIdState(chosen.id);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load merchants");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMerchants();
    return () => { cancelled = true; };
  }, []);

  const setActiveMerchantId = (id: string) => {
    if (!merchants.some((merchant) => merchant.id === id)) return;
    localStorage.setItem(STORAGE_KEY, id);
    setActiveMerchantIdState(id);
  };

  const updateMerchant = (updatedMerchant: MerchantSummary) => {
    setMerchants((current) => current.map((merchant) =>
      merchant.id === updatedMerchant.id ? { ...merchant, ...updatedMerchant } : merchant,
    ));
  };

  const activeMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === activeMerchantId) ?? null,
    [merchants, activeMerchantId],
  );

  return (
    <MerchantContext.Provider value={{
      merchants, activeMerchant, activeMerchantId, loading, error, setActiveMerchantId, updateMerchant,
    }}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  return useContext(MerchantContext);
}

export function MerchantContent({ children }: { children: ReactNode }) {
  const { activeMerchantId, activeMerchant, loading, error } = useMerchant();

  if (loading) {
    return (
      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 pb-8 pt-40 sm:px-6 lg:px-8 lg:pt-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-white" />
          <div className="h-40 animate-pulse rounded-xl border border-border bg-white" />
        </div>
      </main>
    );
  }

  if (error || !activeMerchantId || !activeMerchant) {
    return (
      <main className="min-h-screen lg:ml-64">
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-40 sm:px-6 lg:pt-16">
          <section className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-paytm-navy">Merchant workspace unavailable</h1>
            <p className="mt-2 text-sm text-slate-500">{error || "No merchants are available for this workspace."}</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main key={activeMerchantId} className="min-h-screen lg:ml-64">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-40 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
    </main>
  );
}
