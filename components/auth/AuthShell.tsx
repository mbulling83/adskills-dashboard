"use client";

import Link from "next/link";
import { Brain } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.1fr_1fr]">
          <div className="hidden border-r border-slate-200 bg-slate-50 p-10 lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AdSkills</p>
                <p className="text-sm font-semibold text-slate-900">Manager</p>
              </div>
            </Link>
            <div className="mt-10 space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">
                Operations Console
              </p>
              <h2 className="text-3xl font-semibold leading-tight text-slate-900">
                Professional control for agent skills and team analytics.
              </h2>
              <p className="max-w-md text-sm text-slate-600">
                Keep a clear view of usage, reliability, and optimization opportunities
                in one clean workspace.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AdSkills</p>
                  <p className="text-sm font-semibold text-slate-900">Manager</p>
                </div>
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
