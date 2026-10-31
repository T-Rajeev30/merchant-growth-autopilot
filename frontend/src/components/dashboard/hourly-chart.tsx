"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useFetch } from "@/lib/use-fetch";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { useLanguage } from "@/lib/language-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface HourlyData {
  hour: number;
  label: string;
  currentTransactions: number;
  previousTransactions: number;
  change: number;
}

export function HourlyChart() {
  const { t } = useLanguage();
  const { data, loading, error, refetch } = useFetch<HourlyData[]>("/api/dashboard/hourly-distribution");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("hourlySales")}</CardTitle>
        <CardDescription>{t("hourlyDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading || !data ? (
          <Skeleton className="h-72" />
        ) : data.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-500">{t("noTransactionData")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#002970" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="previousTransactions" name={t("previous")} fill="#475569" radius={[2, 2, 0, 0]} />
              <Bar dataKey="currentTransactions" name={t("current")} fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
