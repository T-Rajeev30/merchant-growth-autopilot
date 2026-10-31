"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState, Skeleton } from "@/components/ui/error-state";
import { api, formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useFetch } from "@/lib/use-fetch";
import { MessageSquare, Copy, ExternalLink, Users, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface MessageResponse {
  message: string;
  segment: string;
  customerCount: number;
  whatsappUrl: string;
  language: string;
}

interface CustomerRecord {
  id: string;
  name: string;
  phoneLast4: string;
  segment: string;
  firstVisit?: string;
  lastVisit?: string;
  totalVisits: number;
  totalSpent: number;
  consentSms: boolean;
}

interface CustomerDirectoryResponse {
  customers: CustomerRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export default function CustomersPage() {
  const { language, t } = useLanguage();
  const [selectedSegment, setSelectedSegment] = useState<string>("inactive");
  const [directorySegment, setDirectorySegment] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [offerDetails, setOfferDetails] = useState("");
  const [result, setResult] = useState<MessageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: segData } = useFetch<{ segments: Record<string, number>; total: number }>("/api/customers/segments");
  const customerPath = `/api/customers?segment=${directorySegment}&q=${encodeURIComponent(search)}&page=${page}`;
  const { data: directory, loading: directoryLoading, error: directoryError, refetch: refetchDirectory } =
    useFetch<CustomerDirectoryResponse>(customerPath);

  const generateMessage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<MessageResponse>("/api/customers/message", {
        method: "POST",
        body: JSON.stringify({
          segment: selectedSegment,
          offerDetails: offerDetails || undefined,
          language,
        }),
      });
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const segments = segData?.segments ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("customerEngagement")}</h1>
        <p className="text-sm text-slate-400 mt-1">Browse merchant customers, review segments, and compose offers for manual WhatsApp sharing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("customerDirectory")}</CardTitle>
              <CardDescription>{directory?.pagination.total ?? 0} customers in this merchant workspace</CardDescription>
            </div>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder={t("searchNames")}
              aria-label={t("searchNames")}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-paytm-navy placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:max-w-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {["all", "loyal", "regular", "inactive", "new"].map((segment) => (
              <button
                key={segment}
                onClick={() => { setDirectorySegment(segment); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  directorySegment === segment
                    ? "bg-paytm-blue text-paytm-navy"
                    : "bg-slate-700 text-slate-500 hover:text-paytm-navy"
                }`}
              >
                {segment} {segData?.segments[segment] !== undefined && `(${segData.segments[segment]})`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {directoryError ? (
            <ErrorState message={directoryError} onRetry={refetchDirectory} />
          ) : directoryLoading || !directory ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
          ) : directory.customers.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No customers match this search and segment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">{t("segment")}</th>
                    <th className="py-3 pr-4 text-right font-medium">{t("visits")}</th>
                    <th className="py-3 pr-4 text-right font-medium">{t("totalSpend")}</th>
                    <th className="py-3 font-medium">{t("lastVisit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-paytm-navy">{customer.name}</p>
                        {customer.phoneLast4 && <p className="mt-0.5 text-xs text-slate-500">•••• {customer.phoneLast4}</p>}
                      </td>
                      <td className="py-3 pr-4 capitalize text-slate-500">{customer.segment}</td>
                      <td className="py-3 pr-4 text-right text-slate-500">{customer.totalVisits}</td>
                      <td className="py-3 pr-4 text-right text-slate-500">{formatCurrency(customer.totalSpent)}</td>
                      <td className="py-3 text-slate-500">
                        {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Showing {directory.customers.length} of {directory.pagination.total}. Phone numbers are masked.</p>
                {directory.pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Page {page} of {directory.pagination.totalPages}</span>
                    <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="secondary" size="sm" disabled={page >= directory.pagination.totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Next page">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              {t("composeMessage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("targetSegment")}</label>
              <div className="flex flex-wrap gap-2">
                {["inactive", "loyal", "regular", "new", "all"].map((seg) => (
                  <button
                    key={seg}
                    onClick={() => setSelectedSegment(seg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedSegment === seg
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                    {segments[seg] !== undefined && (
                      <span className="ml-1 text-slate-500">({segments[seg]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t("offerDetails")}</label>
              <input
                value={offerDetails}
                onChange={(e) => setOfferDetails(e.target.value)}
                placeholder="e.g. 20% off on combos this weekend"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <Button onClick={generateMessage} disabled={loading}>
              {loading ? t("generating") : t("generateMessage")}
            </Button>

            {error && <ErrorState message={error} onRetry={generateMessage} />}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{t("messagePreview")}</CardTitle>
            <CardDescription>
              {result ? `Draft for ${result.customerCount} ${result.segment} customers · review and share manually` : "Generate a message to preview"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="bg-emerald-950/30 border border-emerald-900/30 rounded-xl p-4">
                  <p className="text-sm text-white leading-relaxed">{result.message}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={copyMessage}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? t("copied") : t("copy")}
                  </Button>
                  <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="success" size="sm">
                      <ExternalLink className="h-3 w-3" /> {t("shareWhatsApp")}
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select a segment and generate a message</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
