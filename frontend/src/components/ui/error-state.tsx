"use client";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-900/30">
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-300 mb-4">{message}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse ${className ?? "h-32"}`} />;
}
