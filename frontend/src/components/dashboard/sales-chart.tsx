"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  revenue: number;
  transactions: number;
}

export function SalesChart() {
  const { t } = useLanguage();
  const [data, setData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    api<ChartData[]>(`/api/dashboard/sales-chart?period=${period}`)
      .then((result) => { if (current) setData(result); })
      .catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : "Unable to load revenue trend");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [period, refreshKey]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("revenueTrend")}</CardTitle>
        <div className="flex gap-1">
          {(["daily", "weekly"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "primary" : "ghost"}
              onClick={() => setPeriod(p)}
            >
              {p === "daily" ? t("daily") : t("weekly")}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={() => setRefreshKey((key) => key + 1)} />
        ) : loading ? (
          <Skeleton className="h-72" />
        ) : data.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-500">{t("noTransactionData")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#475569"
                fontSize={11}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              />
              <YAxis stroke="#475569" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#002970" }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
