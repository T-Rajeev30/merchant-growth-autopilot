"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useFetch } from "@/lib/use-fetch";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface Product {
  name: string;
  revenue: number;
  orders: number;
  category: string;
}

export function TopProducts() {
  const { t } = useLanguage();
  const { data: products, loading, error, refetch } = useFetch<Product[]>("/api/dashboard/top-products");

  const maxRevenue = products?.[0]?.revenue || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topProducts")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading || !products ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingBag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{t("noProductData")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                    <span className="text-sm font-medium text-white ml-2">{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                    </div>
                    <Badge variant="default">{p.orders} {t("orderCount")}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
