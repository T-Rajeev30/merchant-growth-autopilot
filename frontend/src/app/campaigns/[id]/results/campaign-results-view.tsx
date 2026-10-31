"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { formatCurrency } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { ArrowLeft, TrendingUp, DollarSign, Target, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CampaignResults {
  campaign: { id: string; name: string; status: string; type: string };
  funnel: {
    totalTargeted: number;
    treatmentGroup: number;
    controlGroup: number;
    contacted: number;
    responded: number;
    purchased: number;
  };
  financials: {
    totalCampaignCost: number;
    treatmentRevenue: number;
    controlRevenue: number;
    incrementalRevenue: number;
    incrementalProfit: number;
    merchantRoi: number;
  };
  conversionRates: {
    treatmentRate: number;
    controlRate: number;
    lift: number;
  };
}

export function CampaignResultsView({ id }: { id: string }) {
  const { data, loading, error, refetch } = useFetch<CampaignResults>(`/api/campaigns/${id}/results`);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/active">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back to Campaigns</Button>
        </Link>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!data || !data.financials) {
    return (
      <div className="space-y-6">
        <Link href="/campaigns/active">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back to Campaigns</Button>
        </Link>
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Target className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300">No results yet</h3>
            <p className="text-sm text-slate-500 mt-1">This campaign has not been simulated yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { campaign, funnel, financials, conversionRates } = data;

  const funnelData = [
    { name: "Targeted", value: funnel.totalTargeted, fill: "#3b82f6" },
    { name: "Contacted", value: funnel.contacted, fill: "#6366f1" },
    { name: "Responded", value: funnel.responded, fill: "#8b5cf6" },
    { name: "Purchased", value: funnel.purchased, fill: "#10b981" },
  ];

  const comparisonData = [
    { name: "Treatment", revenue: financials.treatmentRevenue },
    { name: "Control", revenue: financials.controlRevenue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns/active">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="success">{campaign.status}</Badge>
            <Badge>{campaign.type}</Badge>
          </div>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-900">
          Demo simulation only. No customers were contacted. Outcomes are randomly simulated from this merchant's product prices and costs.
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Campaign Cost", value: formatCurrency(financials.totalCampaignCost), icon: DollarSign, color: "text-red-400" },
          { label: "Incremental Revenue", value: formatCurrency(financials.incrementalRevenue), icon: TrendingUp, color: "text-blue-400" },
          { label: "Incremental gross profit (sim.)", value: formatCurrency(financials.incrementalProfit), icon: TrendingUp, color: "text-emerald-400" },
          { label: "Merchant ROI", value: `${financials.merchantRoi}%`, icon: Target, color: "text-amber-400" },
          { label: "Customers Reached", value: funnel.contacted.toString(), icon: Users, color: "text-purple-400" },
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
          <CardTitle>Campaign Funnel</CardTitle>
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
            <CardTitle>Treatment vs Control Revenue</CardTitle>
            <CardDescription>Revenue comparison from a simulated treatment and control run</CardDescription>
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
              { label: "Treatment Revenue", value: formatCurrency(financials.treatmentRevenue), color: "text-blue-400" },
              { label: "Incremental Revenue", value: formatCurrency(financials.incrementalRevenue), color: "text-emerald-400" },
              { label: "Campaign Cost", value: `-${formatCurrency(financials.totalCampaignCost)}`, color: "text-red-400" },
              { label: "Incremental gross profit", value: formatCurrency(financials.incrementalProfit), color: "text-emerald-400 font-bold text-lg" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                <span className="text-sm text-slate-400">{row.label}</span>
                <span className={`text-sm ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Treatment Conv. Rate</p>
          <p className="text-2xl font-bold text-blue-400">{conversionRates.treatmentRate}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Control Conv. Rate</p>
          <p className="text-2xl font-bold text-slate-400">{conversionRates.controlRate}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Conversion Lift</p>
          <p className="text-2xl font-bold text-emerald-400">
            {conversionRates.treatmentRate > 0 && conversionRates.controlRate > 0
              ? `+${((conversionRates.treatmentRate / conversionRates.controlRate - 1) * 100).toFixed(0)}%`
              : "N/A"}
          </p>
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
              {funnel.controlGroup} customers were held out as a control group.
              Demo simulation only. No customers were contacted. Outcomes use the selected merchant's product prices and costs with randomized sample purchases. Fixed overhead and tax are excluded.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
