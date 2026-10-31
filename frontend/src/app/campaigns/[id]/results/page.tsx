import { Suspense } from "react";
import { CampaignResultsView } from "./campaign-results-view";

export const instant = false;

export default async function CampaignResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="space-y-6"><div className="h-10 w-64 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse" /><div className="h-64 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse" /></div>}>
      <CampaignResultsView id={id} />
    </Suspense>
  );
}
