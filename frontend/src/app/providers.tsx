"use client";
import { LanguageProvider } from "@/lib/language-context";
import { MerchantContent, MerchantProvider } from "@/lib/merchant-context";
import { Sidebar } from "@/components/layout/sidebar";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { VoiceAgentOverlay } from "@/components/voice/voice-agent-overlay";

function AuthenticatedApp({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const authPage = pathname === "/login" || pathname === "/register";
    if (!loading && !user && !authPage) router.replace("/login");
    if (!loading && user && pathname === "/login") router.replace("/");
  }, [loading, user, pathname, router]);
  const authPage = pathname === "/login" || pathname === "/register";
  if (loading || (!user && !authPage)) return <main className="min-h-screen bg-canvas" />;
  if (!user) return <>{children}</>;
  return <MerchantProvider><Sidebar /><MerchantContent>{children}</MerchantContent><VoiceAgentOverlay /></MerchantProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider><AuthProvider><AuthenticatedApp>{children}</AuthenticatedApp></AuthProvider></LanguageProvider>
  );
}
