"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Store } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(email, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <section className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-paytm-blue"><Store className="h-6 w-6 text-paytm-navy" /></div>
        <div><h1 className="text-lg font-bold text-paytm-navy">Merchant Growth</h1><p className="text-xs text-slate-500">Paytm Merchant OS</p></div>
      </div>
      <h2 className="text-xl font-semibold text-paytm-navy">Sign in</h2>
      <p className="mt-1 text-sm text-slate-500">Use your authorized merchant workspace account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-paytm-navy">Email<input autoComplete="username" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-200" /></label>
        <label className="block text-sm font-medium text-paytm-navy">Password<input autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-200" /></label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-paytm-navy px-4 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-xs leading-5 text-slate-500">Account access is invitation only. Ask a merchant owner or admin for an invitation.</p>
      <a href="/register" className="mt-2 inline-block text-xs font-medium text-sky-700 hover:underline">Have an invitation link?</a>
    </section>
  </main>;
}
