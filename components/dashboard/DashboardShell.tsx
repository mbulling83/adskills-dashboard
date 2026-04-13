"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Brain,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/insights", label: "Insights", icon: Lightbulb },
  { href: "/dashboard/tokens", label: "API Tokens", icon: KeyRound },
  { href: "/dashboard/demo", label: "Demo Data", icon: PlayCircle },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  AdSkills
                </p>
                <p className="text-sm font-semibold text-slate-900">Manager</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Performance Workspace
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  Skills Dashboard
                </h1>
              </div>
              <div className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Live Monitoring
              </div>
            </div>
          </header>

          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
