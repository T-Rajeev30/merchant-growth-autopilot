"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";

export default function RegisterPage() {
  const { register, acceptInvitation, user } = useAuth();
  const router = useRouter();
  const [invite, setInvite] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const tokenParams = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.search.slice(1);
    setInvite(new URLSearchParams(tokenParams).get("invite") || "");
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    if (password !== confirm) { setError("Passwords do not match."); setBusy(false); return; }
    try {
      if (user) { await acceptInvitation(invite); router.replace("/"); }
      else await register(invite, password);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete registration"); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
      <div className="mb-7 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paytm-blue"><Store className="h-6 w-6 text-paytm-navy" /></div><div><h1 className="text-lg font-bold text-paytm-navy">Merchant Growth</h1><p className="text-xs text-slate-500">Paytm Merchant OS</p></div></div>
      <h2 className="text-xl font-semibold text-paytm-navy">Accept merchant invitation</h2>
      <p className="mt-1 text-sm text-slate-500">{user ? `Accept this workspace invitation as ${user.email}.` : "Create an account for the merchant workspace that invited you."}</p>
      {!invite ? <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Open the registration link provided by your merchant owner or admin.</p> : user ? <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-paytm-navy px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Accepting invitation…" : "Accept invitation"}</button>
      </form> : <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-paytm-navy">Password<input autoComplete="new-password" type="password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-200" /></label>
        <label className="block text-sm font-medium text-paytm-navy">Confirm password<input autoComplete="new-password" type="password" minLength={12} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-200" /></label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-paytm-navy px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Creating account…" : "Create account"}</button>
      </form>}
    </section>
  </main>;
}
