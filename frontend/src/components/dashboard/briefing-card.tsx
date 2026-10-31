"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/error-state";
import { api, formatCurrency } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { useLanguage } from "@/lib/language-context";
import { Volume2, Sun, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface BriefingResponse {
  briefing: string;
  facts: {
    yesterdayRevenue: number;
    lastWeekRevenue: number;
    revenueChangePercent: number;
    transactions: number;
    bestHour: { hour: number; revenue: number };
    worstHour: { hour: number; revenue: number };
    topProduct: { name: string; revenue: number } | null;
    priorityAction: string;
  };
  language: string;
}

export function BriefingCard() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const loadBriefing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<BriefingResponse>(`/api/insights/briefing?language=${language}`);
      setData(res);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load briefing");
    } finally {
      setLoading(false);
    }
  };

  const playBriefing = async () => {
    if (!data) return;
    setPlaying(true);
    try {
      const res = await api<{ audioBase64: string }>("/api/voice/speak", {
        method: "POST",
        body: JSON.stringify({ text: data.briefing, language }),
      });
      const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
      audio.onended = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
    } catch {
      setPlaying(false);
    }
  };

  if (!data && !loading) {
    if (error) return <ErrorState message={error} onRetry={loadBriefing} />;
    return (
      <Card className="border-amber-900/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
        <CardContent className="p-6 text-center">
          <Sun className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">{t("dailyBriefing")}</h3>
          <p className="text-xs text-slate-400 mb-4">Get yesterday&apos;s performance summary</p>
          <Button onClick={loadBriefing} size="sm">
            <Sun className="h-3.5 w-3.5" /> {t("getBriefing")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <Skeleton className="h-48" />;

  const { briefing, facts } = data!;
  const isUp = facts.revenueChangePercent >= 0;

  return (
    <Card className="border-amber-900/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-amber-400" />
          <CardTitle className="text-base">{t("dailyBriefing")}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={playBriefing} disabled={playing}>
            <Volume2 className={`h-3.5 w-3.5 ${playing ? "animate-pulse text-blue-400" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={loadBriefing}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-200 leading-relaxed mb-4">{briefing}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={isUp ? "success" : "danger"}>
            {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {formatCurrency(facts.yesterdayRevenue)} ({isUp ? "+" : ""}{facts.revenueChangePercent}%)
          </Badge>
          <Badge>{facts.transactions} txns</Badge>
          <Badge variant="info">Best: {facts.bestHour.hour}:00</Badge>
          {facts.topProduct && <Badge variant="success">Top: {facts.topProduct.name}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
