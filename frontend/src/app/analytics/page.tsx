"use client";
import { useState, useEffect, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { api, formatCurrency } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, DollarSign, Target, Users, ArrowRight } from "lucide-react";

interface Campaign {
  id?: string;
  _id?: string;
  name: string;
  status: string;
  actualCost: number | null;
  actualRevenue: number | null;
  actualProfit: number | null;
  results: CampaignResult[];
}

interface CampaignResult {
  totalTargeted: number;
  totalContacted: number;
  totalResponded: number;
  totalPurchased: number;
  controlGroupSize: number;
  controlGroupPurchased: number;
  totalCampaignCost: number;
  treatmentRevenue: number;
  controlRevenue: number;
  incrementalRevenue: number;
  incrementalProfit: number;
  merchantRoi: number;
}

function getId(c: Campaign): string {
  return c.id || c._id || "";
}

export default function AnalyticsPageWrapper() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>}>
      <AnalyticsPage />
    </Suspense>
  );
}

function AnalyticsPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    api<{ campaigns: Campaign[] }>("/api/campaigns")
      .then((d) => {
        const completed = d.campaigns.filter((c) => c.status === "completed" && c.results.length > 0);
        setCampaigns(completed);
        const fromUrl = searchParams.get("campaign");
        if (fromUrl && completed.some((c) => getId(c) === fromUrl)) {
          setSelectedId(fromUrl);
        } else if (completed.length > 0) {
          setSelectedId(getId(completed[0]));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, [searchParams]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("campaignAnalytics")}</h1>
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("campaignAnalytics")}</h1>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">{t("campaignAnalytics")}</h1>
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No completed campaigns yet</h3>
            <p className="text-sm text-slate-500 mt-1">Execute a campaign to see ROI analytics here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selected = campaigns.find((c) => getId(c) === selectedId);
  const result = selected?.results[0];

  const funnelData = result ? [
    { name: "Targeted", value: result.totalTargeted, fill: "#3b82f6" },
    { name: "Contacted", value: result.totalContacted, fill: "#6366f1" },
    { name: "Responded", value: result.totalResponded, fill: "#8b5cf6" },
    { name: "Purchased", value: result.totalPurchased, fill: "#10b981" },
  ] : [];

  const comparisonData = result ? [
    { name: "Treatment", revenue: result.treatmentRevenue },
    { name: "Control", revenue: result.controlRevenue },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("campaignAnalytics")}</h1>
          <p className="text-sm text-slate-400 mt-1">Incremental profit measurement with control group analysis</p>
        </div>
        {campaigns.length > 1 && (
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {campaigns.map((c) => (
              <option key={getId(c)} value={getId(c)}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-900">
          Campaign analytics use simulated outcomes. No customers were contacted; incremental profit is estimated from catalog costs and simulated campaign costs.
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: t("campaignCost"), value: formatCurrency(result.totalCampaignCost), icon: DollarSign, color: "text-red-400" },
              { label: t("incrementalRevenue"), value: formatCurrency(result.incrementalRevenue), icon: TrendingUp, color: "text-blue-400" },
              { label: t("incrementalGrossProfit"), value: formatCurrency(result.incrementalProfit), icon: TrendingUp, color: "text-emerald-400" },
              { label: t("merchantRoi"), value: `${result.merchantRoi}%`, icon: Target, color: "text-amber-400" },
              { label: t("customersReached"), value: result.totalContacted.toString(), icon: Users, color: "text-purple-400" },
            ].map((kpi) => (
              <Card key={kpi.label} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <p className="text-xs text-slate-400">{kpi.label}</p>
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("campaignFunnel")}</CardTitle>
              <CardDescription>Customer journey through the campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-3 px-2 sm:px-6">
                {funnelData.map((step, i) => (
                  <div key={step.name} className="flex items-center gap-4">
                    <div className="text-center">
                      <div
                        className="rounded-xl mx-auto mb-2 flex items-center justify-center font-bold text-white text-lg"
                        style={{
                          backgroundColor: step.fill + "30",
                          border: `2px solid ${step.fill}`,
                          width: Math.max(60, 120 - i * 15),
                          height: Math.max(60, 120 - i * 15),
                        }}
                      >
                        {step.value}
                      </div>
                      <p className="text-xs text-slate-400">{step.name}</p>
                      {i > 0 && (
                        <p className="text-[10px] text-slate-500">
                          {((step.value / funnelData[i - 1].value) * 100).toFixed(0)}% rate
                        </p>
                      )}
                    </div>
                    {i < funnelData.length - 1 && <ArrowRight className="h-5 w-5 text-slate-600" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("treatmentVsControl")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                    <YAxis stroke="#475569" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#002970" }}
                      formatter={(value: unknown) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      <Cell fill="#3b82f6" />
                      <Cell fill="#475569" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Treatment Revenue", value: formatCurrency(result.treatmentRevenue), color: "text-blue-400" },
                  { label: "Incremental Revenue", value: formatCurrency(result.incrementalRevenue), color: "text-emerald-400" },
                  { label: "Campaign Cost", value: `-${formatCurrency(result.totalCampaignCost)}`, color: "text-red-400" },
                  { label: "Incremental gross profit", value: formatCurrency(result.incrementalProfit), color: "text-emerald-400 font-bold text-lg" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                    <span className="text-sm text-slate-400">{row.label}</span>
                    <span className={`text-sm ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-900/30 bg-blue-950/20">
            <CardContent className="p-4 flex gap-3">
              <div className="rounded-lg bg-blue-600/20 p-2 h-fit">
                <Target className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-400">Control Group Methodology</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {result.controlGroupSize} customers were held out as a control group.
                  Gross profit uses the catalog's product costs and simulated campaign costs. Fixed overhead and tax are excluded.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
