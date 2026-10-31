"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFetch } from "@/lib/use-fetch";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface Segment {
  name: string;
  count: number;
  percentage: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#6366f1"];

export function CustomerSegments() {
  const { t } = useLanguage();
  const { data: segments, loading, error, refetch } = useFetch<Segment[]>("/api/dashboard/customer-segments");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customerSegments")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading || !segments ? (
          <Skeleton className="h-36" />
        ) : segments.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{t("noTransactionData")}</p>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={segments} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" strokeWidth={0}>
                  {segments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#002970" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {segments.map((seg, i) => (
                <div key={seg.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm text-slate-300">{seg.name}</span>
                  <span className="text-sm font-medium text-white ml-auto">{seg.count}</span>
                  <span className="text-xs text-slate-500">({seg.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
