"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { useFetch } from "@/lib/use-fetch";
import { Activity, Zap, AlertCircle, IndianRupee } from "lucide-react";

interface Metrics {
  windowHours: number;
  totalCalls: number;
  successCalls: number;
  fallbackCount: number;
  successRatePercent: number;
  avgLatencyMs: number;
  estCostInr: number;
  byKind: Record<string, { calls: number; avgLatency: number; cost: number }>;
}

export function AiOpsPanel() {
  const { data, loading, error, refetch } = useFetch<Metrics>("/api/ops/ai-metrics");

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const latencyColor = data.avgLatencyMs < 1000 ? "success" : data.avgLatencyMs < 3000 ? "warning" : "danger";

  return (
    <Card className="border-blue-900/20 bg-gradient-to-br from-blue-950/10 to-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-blue-400" />
          AI Ops (last {data.windowHours}h)
        </CardTitle>
        <CardDescription>Sarvam call latency, fallback rate, and estimated spend</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 text-xs">
              <Zap className="h-3 w-3" /> Calls
            </div>
            <p className="text-xl font-semibold text-white">{data.totalCalls}</p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 text-xs">
              <Activity className="h-3 w-3" /> Avg latency
            </div>
            <p className="text-xl font-semibold text-white">
              {data.avgLatencyMs}<span className="text-xs text-slate-500 ml-1">ms</span>
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 text-xs">
              <AlertCircle className="h-3 w-3" /> Fallbacks
            </div>
            <p className="text-xl font-semibold text-white">
              {data.fallbackCount}<span className="text-xs text-slate-500 ml-1">({(100 - data.successRatePercent).toFixed(1)}%)</span>
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 text-xs">
              <IndianRupee className="h-3 w-3" /> Est. cost
            </div>
            <p className="text-xl font-semibold text-emerald-400">
              ₹{data.estCostInr.toFixed(2)}
            </p>
          </div>
        </div>

        {Object.keys(data.byKind).length > 0 && (
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-500">By kind:</span>
            {Object.entries(data.byKind).map(([kind, m]) => (
              <Badge key={kind} variant="info">
                {kind}: {m.calls} · {m.avgLatency}ms · ₹{m.cost.toFixed(2)}
              </Badge>
            ))}
            <Badge variant={latencyColor}>
              {data.successRatePercent}% success
            </Badge>
          </div>
        )}
        {data.totalCalls === 0 && (
          <p className="text-xs text-slate-500">No AI calls yet. Try the Daily Briefing or AI Assistant.</p>
        )}
      </CardContent>
    </Card>
  );
}
