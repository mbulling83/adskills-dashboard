"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Megaphone, Users, Activity } from "lucide-react";

const navItems = [
  { href: "/admin/orgs", label: "Organisations", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/usage", label: "Usage", icon: Activity },
  { href: "/dashboard/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 h-screen w-64 shrink-0 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin Console
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Platform Management</p>
          </div>
          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
        <main className="min-w-0 flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
