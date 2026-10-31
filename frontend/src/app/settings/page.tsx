"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { api } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";
import { useLanguage } from "@/lib/language-context";
import { useMerchant } from "@/lib/merchant-context";

interface MerchantProfile {
  id: string;
  name: string;
  businessType: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  dataMode: "simulated" | "live";
}

const emptyProfile = { name: "", businessType: "", address: "", city: "", phone: "", email: "" };

export default function SettingsPage() {
  const { t } = useLanguage();
  const { updateMerchant } = useMerchant();
  const { data, loading, error, refetch } = useFetch<{ merchant: MerchantProfile }>("/api/merchants/profile");
  const [form, setForm] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.merchant) return;
    const { name, businessType, address, city, phone, email } = data.merchant;
    setForm({ name, businessType, address: address || "", city: city || "", phone: phone || "", email: email || "" });
  }, [data]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      const result = await api<{ merchant: MerchantProfile }>("/api/merchants/profile", { method: "PATCH", body: JSON.stringify(form) });
      updateMerchant(result.merchant);
      await refetch();
      setNotice("Merchant profile saved.");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Profile could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-80" /></div>;
  if (error) return <div className="space-y-4"><h1 className="text-2xl font-bold text-paytm-navy">{t("settings")}</h1><ErrorState message={error} onRetry={refetch} /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-paytm-navy">{t("merchantSettings")}</h1>
        <p className="mt-1 text-sm text-slate-500">Update the selected merchant&apos;s business profile.</p>
      </div>

      {saveError && <ErrorState message={saveError} />}
      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      {data?.merchant.dataMode === "simulated" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This workspace contains simulated demo data. Saving profile details does not connect to Paytm services.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>These details appear only in this merchant workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-500">
                {t("businessName")}
                <input required minLength={2} maxLength={120} value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-500">
                {t("businessType")}
                <input required minLength={2} maxLength={80} value={form.businessType} onChange={(e) => update("businessType", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-500 sm:col-span-2">
                {t("address")}
                <input maxLength={250} value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-500">
                {t("city")}
                <input maxLength={100} value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-500">
                {t("phone")}
                <input maxLength={40} value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
              <label className="space-y-1 text-sm font-medium text-slate-500 sm:col-span-2">
                {t("email")}
                <input type="email" maxLength={254} value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-paytm-navy" />
              </label>
            </div>
            <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveProfile")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
