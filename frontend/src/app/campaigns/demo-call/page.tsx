"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { Phone, PhoneCall, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

interface DemoConfig {
  recipientConfigured: boolean;
  consentGranted: boolean;
  telephonyConfigured: boolean;
  provider: string | null;
  publicWsConfigured: boolean;
  publicCallbackConfigured: boolean;
  recipientName: string | null;
  maskedPhone: string | null;
  ready: boolean;
}

interface Campaign { id?: string; _id?: string; name: string; status: string; isDemoCall?: boolean; voiceLanguage?: string; discountPercent?: number; }

interface DemoCall {
  status: string;
  providerCallId: string | null;
  customerName: string;
  maskedPhone: string;
  language: string;
  durationSec: number | null;
  outcome: string | null;
  startedAt: string;
  answeredAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  transcript?: Array<{ role: string; text: string; at: string }>;
}

const statusBadge: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  initiating: "warning", queued: "warning", ringing: "info", "in-progress": "info",
  completed: "success", failed: "danger", busy: "warning", "no-answer": "warning", rejected: "danger",
};
const TERMINAL = new Set(["completed", "failed", "busy", "no-answer", "rejected"]);

function getId(c: Campaign) { return c.id || c._id || ""; }

export default function DemoCallPage() {
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [demoCall, setDemoCall] = useState<DemoCall | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [optInChecked, setOptInChecked] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConfig = useCallback(async () => {
    try { setConfig(await api<DemoConfig>("/api/campaigns/demo-call/config")); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load demo call configuration"); }
  }, []);

  const loadDemoCampaigns = useCallback(async () => {
    try {
      const { campaigns } = await api<{ campaigns: Campaign[] }>("/api/campaigns");
      const demo = campaigns.find((c) => c.isDemoCall && ["pending", "approved", "running", "completed"].includes(c.status));
      setCampaign(demo ?? null);
      return demo ?? null;
    } catch { return null; }
  }, []);

  useEffect(() => { void loadConfig(); void loadDemoCampaigns(); }, [loadConfig, loadDemoCampaigns]);

  // Poll the live call status while a call is active.
  const startPolling = useCallback((campaignId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { demoCall } = await api<{ demoCall: DemoCall }>(`/api/campaigns/${campaignId}/demo-call`);
        setDemoCall(demoCall);
        if (TERMINAL.has(demoCall.status) && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } catch { /* keep polling */ }
    }, 2000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const createCampaign = async () => {
    setBusy(true); setError(null); setNotice(null);
    try {
      const { campaign } = await api<{ campaign: Campaign }>("/api/campaigns/demo-call", {
        method: "POST", body: JSON.stringify({ language: "hi-IN", discountPercent: 10 }),
      });
      setCampaign(campaign);
      setNotice("Demo call campaign created. It must be approved before the call can be placed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create the demo campaign"); }
    finally { setBusy(false); }
  };

  const approveCampaign = async () => {
    if (!campaign) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await api(`/api/campaigns/${getId(campaign)}/approve`, { method: "PATCH" });
      await loadDemoCampaigns();
      setNotice("Campaign approved. You can now place the demo call.");
    } catch (e) { setError(e instanceof Error ? e.message : "Approval failed"); }
    finally { setBusy(false); }
  };

  const runDemoCall = async () => {
    if (!campaign) return;
    const campaignId = getId(campaign);
    setBusy(true); setError(null); setNotice(null);
    try {
      const { demoCall } = await api<{ demoCall: DemoCall }>(`/api/campaigns/${campaignId}/run-demo-call`, {
        method: "POST", body: JSON.stringify({ confirmRecipientEmail: confirmEmail.trim() }),
      });
      setDemoCall(demoCall);
      setShowConfirm(false);
      setNotice(`Call initiated. Provider call ID: ${demoCall.providerCallId ?? "pending"}.`);
      await loadDemoCampaigns();
      startPolling(campaignId);
    } catch (e) { setError(e instanceof Error ? e.message : "The call could not be placed"); }
    finally { setBusy(false); }
  };

  const configRow = (ok: boolean, label: string, detail?: string) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <ShieldAlert className="h-4 w-4 text-amber-400" />}
      <span className={ok ? "text-slate-300" : "text-amber-300"}>{label}</span>
      {detail && <span className="text-slate-500">· {detail}</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><PhoneCall className="h-6 w-6 text-blue-400" /> Single Customer Demo Call</h1>
        <p className="text-sm text-slate-400 mt-1">Place one real outbound AI call to the configured, consented test contact. This is not a simulation.</p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}

      <Card>
        <CardContent className="p-5 space-y-2">
          <h2 className="text-sm font-semibold text-white mb-2">Configuration</h2>
          {config ? (
            <>
              {configRow(config.recipientConfigured, "Test recipient configured", config.recipientName ? `${config.recipientName} · ${config.maskedPhone}` : undefined)}
              {configRow(config.consentGranted, "Explicit calling consent recorded")}
              {configRow(config.telephonyConfigured, "Telephony provider configured", config.provider || undefined)}
              {configRow(config.publicWsConfigured, "Public media WebSocket (PUBLIC_WS_URL)")}
              {configRow(config.publicCallbackConfigured, "Public status callback (PUBLIC_BASE_URL)")}
              {!config.ready && <p className="mt-2 text-xs text-amber-300">The call cannot be placed until every item above is satisfied in the backend environment.</p>}
            </>
          ) : <p className="text-sm text-slate-500">Loading configuration…</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Campaign</h2>
          {!campaign ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">No demo call campaign yet.</p>
              <Button onClick={createCampaign} disabled={busy || !config?.recipientConfigured}>Create demo call campaign</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{campaign.name}</span>
                <Badge variant={statusBadge[campaign.status] ?? "default"}>{campaign.status}</Badge>
                <Badge variant="info">demo call</Badge>
              </div>
              <div className="flex gap-2">
                {campaign.status === "pending" && <Button variant="success" onClick={approveCampaign} disabled={busy}>Approve</Button>}
                {campaign.status === "approved" && (
                  <Button onClick={() => { setShowConfirm(true); setConfirmEmail(""); setOptInChecked(false); }} disabled={busy || !config?.ready}>
                    <Phone className="h-4 w-4" /> Run Campaign
                  </Button>
                )}
                {(campaign.status === "running" || campaign.status === "completed") && !demoCall && (
                  <Button variant="secondary" onClick={() => startPolling(getId(campaign))}>Show call status</Button>
                )}
              </div>
              {campaign.status === "approved" && !config?.ready && (
                <p className="text-xs text-amber-300">Resolve the configuration items above before placing the call.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showConfirm && campaign && (
        <div role="dialog" aria-modal="true" aria-label="Confirm demo call" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Confirm the demo call</h3>
              <p className="text-sm text-slate-400">
                This places one real phone call to the configured test contact{config?.maskedPhone ? ` (${config.maskedPhone})` : ""}. Confirm the recipient has opted in.
              </p>
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={optInChecked} onChange={(e) => setOptInChecked(e.target.checked)} className="mt-1" />
                I confirm the test contact has explicitly opted in to receive this call.
              </label>
              <label className="block text-sm text-slate-300">
                Type the recipient email to confirm
                <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="recipient email" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600" />
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={busy}>Cancel</Button>
                <Button variant="success" onClick={runDemoCall} disabled={busy || !optInChecked || !confirmEmail.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />} Place call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {demoCall && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Live call</h2>
              <Badge variant={statusBadge[demoCall.status] ?? "default"}>{demoCall.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Customer</p><p className="text-slate-200">{demoCall.customerName}</p></div>
              <div><p className="text-xs text-slate-500">Phone</p><p className="text-slate-200">{demoCall.maskedPhone}</p></div>
              <div><p className="text-xs text-slate-500">Language</p><p className="text-slate-200">{demoCall.language}</p></div>
              <div><p className="text-xs text-slate-500">Provider call ID</p><p className="text-slate-200 break-all">{demoCall.providerCallId ?? "—"}</p></div>
              <div><p className="text-xs text-slate-500">Duration</p><p className="text-slate-200">{demoCall.durationSec != null ? `${demoCall.durationSec}s` : "—"}</p></div>
              <div><p className="text-xs text-slate-500">Outcome</p><p className="text-slate-200">{demoCall.outcome ?? "—"}</p></div>
            </div>
            {demoCall.lastError && <p className="text-sm text-red-300">{demoCall.lastError}</p>}
            {demoCall.transcript && demoCall.transcript.length > 0 && (
              <div className="mt-2 space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <p className="text-xs font-medium text-slate-400">Transcript</p>
                {demoCall.transcript.map((line, i) => (
                  <p key={i} className="text-sm"><span className={line.role === "assistant" ? "text-blue-400" : "text-emerald-400"}>{line.role === "assistant" ? "AI" : "Customer"}:</span> <span className="text-slate-300">{line.text}</span></p>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500">Status updates come from the telephony provider's webhooks. No transitions are simulated.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
