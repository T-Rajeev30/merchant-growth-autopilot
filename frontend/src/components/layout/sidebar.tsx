"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage, LANGUAGES } from "@/lib/language-context";
import { useMerchant } from "@/lib/merchant-context";
import { useAuth } from "@/lib/auth-context";

import {
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  BarChart3,
  MessageSquare,
  Store,
  Globe,
  Package,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Opportunities", icon: Lightbulb },
  { href: "/campaigns/active", label: "Campaigns", icon: Megaphone },
  { href: "/operations", label: "Operations", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { merchants, activeMerchant, activeMerchantId, setActiveMerchantId, error: merchantError } = useMerchant();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <Store className="h-5 w-5 text-white" />
        </div>

        <div>
          <h1 className="text-sm font-bold text-white">Merchant Growth</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
            Autopilot by Paytm
          </p>
        </div>
      </div>

      <div className="px-3 py-4">
        <div className="mb-4 rounded-lg bg-slate-900/50 border border-slate-800 p-3">
          <p className="text-xs text-slate-500">Active Merchant</p>

          {merchants.length > 1 ? (
            <select
              aria-label="Active merchant"
              value={activeMerchantId || ""}
              onChange={(e) => setActiveMerchantId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>{merchant.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium text-white mt-1">
              {activeMerchant
                ? activeMerchant.name
                : merchantError
                  ? "Merchant unavailable"
                  : "Loading merchant..."}
            </p>
          )}

          <p className="text-[11px] text-slate-500 mt-1">
            {activeMerchant
              ? `${activeMerchant.address || activeMerchant.city}, ${activeMerchant.city}`
              : "Connecting to backend"}
          </p>

          {activeMerchant && (
            <p className="text-[10px] text-emerald-400 mt-2">● Connected</p>
          )}
        </div>

        <nav aria-label="Main navigation" className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-400" : "text-slate-500",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-lg bg-slate-900/50 border border-slate-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs text-slate-500">Language</p>
          </div>

          <label htmlFor="sidebar-language" className="sr-only">Language</label>
          <select
            id="sidebar-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">AI Engine Active</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-slate-500" title={user?.email || ""}>{user?.email}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
