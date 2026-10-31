"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { Megaphone, Eye, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

interface Campaign {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  status: string;
  type: string;
  channel?: "message" | "voice";
  budgetAmount: number;
  estimatedProfit: number;
  actualCost: number | null;
  actualProfit: number | null;
  targetSegment: string;
  createdAt: string;
}

const statusBadge: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  approved: "info",
  running: "info",
  completed: "success",
  rejected: "danger",
};

export default function ActiveCampaignsPage() {
  const { t } = useLanguage();
  const { data, loading, error, refetch } = useFetch<{ campaigns: Campaign[] }>("/api/campaigns");
  const campaigns = data?.campaigns ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("campaigns")}</h1>
          <p className="text-sm text-slate-400 mt-1">Track and manage all your growth campaigns</p>
        </div>
        <Link href="/campaigns/demo-call">
          <Button variant="secondary" size="sm"><PhoneCall className="h-3 w-3" /> Single Customer Demo Call</Button>
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No campaigns yet</h3>
            <p className="text-sm text-slate-500 mt-1">Head to Opportunities to generate your first campaign</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const cId = c.id || c._id || "";
            return (
              <Card key={cId}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{c.name}</h3>
                      <Badge variant={statusBadge[c.status]}>{c.status}</Badge>
                      <Badge>{c.type}</Badge>
                      {c.channel === "voice" && <Badge variant="info">Voice draft</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{c.description}</p>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>Budget: {formatCurrency(c.budgetAmount)}</span>
                      <span>Target: {c.targetSegment}</span>
                      {typeof c.actualProfit === "number" && (
                        <span className="text-emerald-700">Simulated incremental profit: {formatCurrency(c.actualProfit)}</span>
                      )}
                      <span>{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  {c.status === "completed" && (
                    <Link href={`/campaigns/${cId}/results`}>
                      <Button variant="secondary" size="sm">
                        <Eye className="h-3 w-3" /> View Results
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
