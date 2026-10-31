"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { api, formatCurrency } from "@/lib/utils";
import { Lightbulb, Zap, AlertTriangle, TrendingDown, Users, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface Recommendation {
  id: string;
  _id?: string;
  opportunityType: string;
  title: string;
  description: string;
  reasoning: string;
  severity: string;
  metrics: Record<string, unknown>;
  suggestedAction: string;
  estimatedCost: number;
  estimatedProfit: number;
  status: string;
}

interface Campaign {
  id: string;
  _id?: string;
  name: string;
  description: string;
  status: string;
  type: string;
  channel?: "message" | "voice";
  voiceMessage?: string;
  voiceLanguage?: string;
  budgetAmount: number;
  estimatedProfit?: number;
  discountPercent: number | null;
  targetSegment: string;
}

const severityColors = { high: "danger", medium: "warning", low: "info" } as const;
const typeIcons: Record<string, typeof TrendingDown> = {
  declining_sales: TrendingDown,
  inactive_customers: Users,
  underperforming_product: ShoppingBag,
  low_aov: AlertTriangle,
};

function getId(item: { id?: string; _id?: string }): string {
  return item.id || item._id || "";
}

export default function OpportunitiesPage() {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [voicePreviewing, setVoicePreviewing] = useState(false);
  const [campaignDraft, setCampaignDraft] = useState({
    name: "",
    description: "",
    type: "discount",
    channel: "message",
    voiceMessage: "",
    voiceLanguage: "en-IN",
    targetSegment: "all",
    budgetAmount: "1000",
    discountPercent: "10",
    durationDays: "14",
  });
  const [reasoning, setReasoning] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [recs, camps] = await Promise.all([
        api<{ recommendations: Recommendation[] }>("/api/opportunities"),
        api<{ campaigns: Campaign[] }>("/api/campaigns"),
      ]);
      setRecommendations(recs.recommendations);
      setCampaigns(camps.campaigns);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runDetection = async () => {
    setDetecting(true);
    setActionError(null);
    setNotice(null);
    try {
      const result = await api<{ opportunities: Recommendation[] }>("/api/opportunities/detect", { method: "POST" });
      await loadData();
      setNotice(result.opportunities.length ? `Analysis complete. ${result.opportunities.length} opportunities are available.` : "Analysis complete. No new opportunities were found.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Opportunity analysis failed");
    } finally {
      setDetecting(false);
    }
  };

  const generateCampaign = async (id: string) => {
    setGeneratingId(id);
    setActionError(null);
    setNotice(null);
    try {
      const res = await api<{ campaign: Campaign; reasoning: string }>(`/api/opportunities/${id}/recommend`, { method: "POST" });
      setReasoning((prev) => ({ ...prev, [id]: res.reasoning }));
      await loadData();
      setNotice("Campaign draft created and added to the approval queue.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Campaign draft could not be created");
    } finally {
      setGeneratingId(null);
    }
  };

  const approveCampaign = async (id: string) => {
    setActionId(id); setActionError(null); setNotice(null);
    try {
      await api(`/api/campaigns/${id}/approve`, { method: "PATCH" });
      await loadData();
      setNotice("Campaign approved.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Campaign approval failed");
    } finally { setActionId(null); }
  };

  const rejectCampaign = async (id: string) => {
    setActionId(id); setActionError(null); setNotice(null);
    try {
      await api(`/api/campaigns/${id}/reject`, { method: "PATCH" });
      await loadData();
      setNotice("Campaign rejected.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Campaign rejection failed");
    } finally { setActionId(null); }
  };

  const simulateCampaign = async (id: string) => {
    setActionId(id); setActionError(null); setNotice(null);
    try {
      const result = await api<{ error?: string }>(`/api/campaigns/${id}/simulate`, { method: "POST" });
      if (result.error) throw new Error(result.error);
      await loadData();
      setNotice("Demo simulation completed. No customers were contacted.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Campaign simulation failed");
    } finally { setActionId(null); }
  };

  const createCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingCampaign(true);
    setActionError(null);
    setNotice(null);
    try {
      await api("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          ...campaignDraft,
          budgetAmount: Number(campaignDraft.budgetAmount),
          discountPercent: Number(campaignDraft.discountPercent),
          durationDays: Number(campaignDraft.durationDays),
        }),
      });
      await loadData();
      setShowCreateCampaign(false);
      setCampaignDraft({ name: "", description: "", type: "discount", channel: "message", voiceMessage: "", voiceLanguage: "en-IN", targetSegment: "all", budgetAmount: "1000", discountPercent: "10", durationDays: "14" });
      setNotice("Campaign draft created and added to the approval queue. No messages have been sent.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Campaign draft could not be created");
    } finally {
      setCreatingCampaign(false);
    }
  };

  const previewCampaignVoice = async (text = campaignDraft.voiceMessage, language = campaignDraft.voiceLanguage) => {
    if (!text.trim()) return;
    setVoicePreviewing(true);
    setActionError(null);
    try {
      const audioData = await api<{ audioBase64: string; mimeType: string }>("/api/voice/speak", {
        method: "POST",
        body: JSON.stringify({ text, language }),
      });
      const audio = new Audio(`data:${audioData.mimeType};base64,${audioData.audioBase64}`);
      await audio.play();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Voice preview could not be played");
    } finally {
      setVoicePreviewing(false);
    }
  };

  if (error && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("opportunityDetection")}</h1>
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  const pendingCampaigns = campaigns.filter((c) => c.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("opportunityDetection")}</h1>
          <p className="text-sm text-slate-400 mt-1">{t("analyzeBusiness")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowCreateCampaign((open) => !open)}>
            {showCreateCampaign ? t("closeForm") : t("createCampaign")}
          </Button>
          <Button onClick={runDetection} disabled={detecting} size="lg">
            <Zap className="h-4 w-4" />
            {detecting ? t("analyzing") : t("runAnalysis")}
          </Button>
        </div>
      </div>

      {showCreateCampaign && (
        <Card>
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={createCampaign} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-paytm-navy">{t("createCampaign")}</h2>
                <p className="mt-1 text-sm text-slate-500">Drafts require approval. This prototype does not send campaign messages.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("campaignName")}
                  <input required minLength={2} maxLength={100} value={campaignDraft.name} onChange={(e) => setCampaignDraft({ ...campaignDraft, name: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("campaignType")}
                  <select value={campaignDraft.type} onChange={(e) => setCampaignDraft({ ...campaignDraft, type: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy">
                    <option value="discount">Discount</option><option value="combo">Combo</option><option value="loyalty">Loyalty</option><option value="reactivation">Reactivation</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("campaignChannel")}
                  <select value={campaignDraft.channel} onChange={(e) => setCampaignDraft({ ...campaignDraft, channel: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy">
                    <option value="message">Message campaign</option><option value="voice">Voice campaign draft</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("targetSegment")}
                  <select value={campaignDraft.targetSegment} onChange={(e) => setCampaignDraft({ ...campaignDraft, targetSegment: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy">
                    <option value="all">All customers</option><option value="loyal">Loyal</option><option value="regular">Regular</option><option value="inactive">Inactive</option><option value="new">New</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("plannedBudget")}
                  <input type="number" min="0" max="10000000" step="1" required value={campaignDraft.budgetAmount} onChange={(e) => setCampaignDraft({ ...campaignDraft, budgetAmount: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("discount")}
                  <input type="number" min="0" max="50" step="1" required value={campaignDraft.discountPercent} onChange={(e) => setCampaignDraft({ ...campaignDraft, discountPercent: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-500">
                  {t("durationDays")}
                  <input type="number" min="1" max="60" step="1" required value={campaignDraft.durationDays} onChange={(e) => setCampaignDraft({ ...campaignDraft, durationDays: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
                </label>
              </div>
              <label className="block space-y-1 text-xs font-medium text-slate-500">
                {t("description")}
                <textarea maxLength={1000} rows={3} value={campaignDraft.description} onChange={(e) => setCampaignDraft({ ...campaignDraft, description: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
              </label>
              {campaignDraft.channel === "voice" && (
                <div className="space-y-3 rounded-lg border border-sky-100 bg-sky-50 p-4">
                  <label className="block space-y-1 text-xs font-medium text-slate-500">
                    {t("voiceMessage")}
                    <textarea required maxLength={5000} rows={3} value={campaignDraft.voiceMessage} onChange={(e) => setCampaignDraft({ ...campaignDraft, voiceMessage: e.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy" />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-slate-500">
                      {t("spokenLanguage")}
                      <select value={campaignDraft.voiceLanguage} onChange={(e) => setCampaignDraft({ ...campaignDraft, voiceLanguage: e.target.value })} className="ml-2 rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-paytm-navy">
                        <option value="en-IN">English</option><option value="hi-IN">Hindi</option><option value="kn-IN">Kannada</option>
                      </select>
                    </label>
                    <Button type="button" variant="secondary" size="sm" onClick={() => previewCampaignVoice()} disabled={voicePreviewing || !campaignDraft.voiceMessage.trim()}>
                      {voicePreviewing ? t("preparingPreview") : t("previewVoice")}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Preview audio is for review only. This draft does not call customers or connect to Paytm Soundbox.</p>
                </div>
              )}
              <Button type="submit" disabled={creatingCampaign}>{creatingCampaign ? "Creating..." : t("draftForApproval")}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {actionError && <ErrorState message={actionError} />}
      {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <>
          {error && <ErrorState message={error} onRetry={loadData} />}

          {recommendations.filter((r) => r.status === "new").length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                Detected Opportunities
              </h2>
              {recommendations.filter((r) => r.status === "new").map((rec) => {
                const recId = getId(rec);
                const Icon = typeIcons[rec.opportunityType] || AlertTriangle;
                return (
                  <Card key={recId}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          <div className="rounded-lg bg-slate-800 p-3 h-fit">
                            <Icon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{rec.title}</h3>
                              <Badge variant={severityColors[rec.severity as keyof typeof severityColors]}>
                                {rec.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{rec.description}</p>
                            <details className="group mb-3">
                              <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">Why was this detected?</summary>
                              <p className="mt-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg p-3">{rec.reasoning}</p>
                            </details>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                              <span>Estimated campaign cost: <strong className="text-white">{formatCurrency(rec.estimatedCost)}</strong></span>
                              {typeof rec.metrics.lostRevenue === "number" && (
                                <span>Revenue at risk: <strong className="text-white">{formatCurrency(rec.metrics.lostRevenue)}</strong></span>
                              )}
                            </div>
                            {reasoning[recId] && (
                              <div className="mt-3 text-xs text-slate-400 bg-blue-950/30 border border-blue-900/30 rounded-lg p-3">
                                <strong className="text-blue-400">AI Reasoning:</strong> {reasoning[recId]}
                              </div>
                            )}
                          </div>
                        </div>
                          <Button onClick={() => generateCampaign(recId)} disabled={generatingId === recId || actionId !== null}>
                          <Zap className="h-3 w-3" />
                          {generatingId === recId ? "Generating..." : "Generate Campaign"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {pendingCampaigns.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Campaigns Awaiting Approval</h2>
              {pendingCampaigns.map((c) => {
                const cId = getId(c);
                return (
                  <Card key={cId} className="border-amber-900/30">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{c.name}</h3>
                          <Badge variant="info">{c.channel === "voice" ? "Voice campaign" : "Message campaign"}</Badge>
                          <p className="text-sm text-slate-400 mb-3">{c.description}</p>
                          {c.channel === "voice" && c.voiceMessage && (
                            <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50 p-3">
                              <p className="text-xs font-medium text-slate-500">Voice script · {c.voiceLanguage || "en-IN"}</p>
                              <p className="mt-1 text-sm text-paytm-navy">{c.voiceMessage}</p>
                              <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => previewCampaignVoice(c.voiceMessage, c.voiceLanguage || "en-IN")} disabled={voicePreviewing}>
                                {voicePreviewing ? "Preparing preview..." : "Preview voice"}
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-slate-400">
                            <span>Budget: <strong className="text-white">{formatCurrency(c.budgetAmount)}</strong></span>
                            <span>Discount: <strong className="text-white">{c.discountPercent || 0}%</strong></span>
                            <span>Target: <strong className="text-white">{c.targetSegment}</strong></span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="success" onClick={() => approveCampaign(cId)} disabled={actionId !== null}>{actionId === cId ? t("saving") : t("approve")}</Button>
                          <Button variant="danger" onClick={() => rejectCampaign(cId)} disabled={actionId !== null}>{actionId === cId ? t("saving") : t("reject")}</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {campaigns.filter((c) => c.status === "approved").length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Approved Campaigns</h2>
              {campaigns.filter((c) => c.status === "approved").map((c) => {
                const cId = getId(c);
                return (
                  <Card key={cId} className="border-emerald-900/30">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{c.name}</h3>
                        <p className="text-sm text-slate-400">{c.description}</p>
                      </div>
                      <Button variant="success" onClick={() => simulateCampaign(cId)} disabled={actionId !== null}>
                        <Zap className="h-3 w-3" /> {actionId === cId ? t("simulating") : t("runSimulation")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {recommendations.length === 0 && !loading && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Lightbulb className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300">No opportunities detected yet</h3>
                <p className="text-sm text-slate-500 mt-1">Click &quot;Run AI Analysis&quot; to scan your business data</p>
              </CardContent>
            </Card>
          )}
          {recommendations.length > 0 && recommendations.every((r) => r.status !== "new") && pendingCampaigns.length === 0 && campaigns.every((c) => c.status !== "approved") && (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center">
                <Lightbulb className="mx-auto mb-3 h-10 w-10 text-slate-500" />
                <h3 className="font-medium text-paytm-navy">{t("noAttention")}</h3>
                <p className="mt-1 text-sm text-slate-500">Run an analysis to look for new merchant opportunities.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
