"use client";
import { Card } from "@/components/ui/card";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  prefix?: string;
}

export function StatCard({ title, value, change, icon: Icon, prefix }: StatCardProps) {
  const { t } = useLanguage();
  const isPositive = change >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", isPositive ? "text-emerald-400" : "text-red-400")}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(change)} {t("vsLastMonth")}
          </div>
        </div>
        <div className="rounded-lg bg-blue-600/10 p-2.5">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
      </div>
    </Card>
  );
}
