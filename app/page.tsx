import Link from "next/link";
import { ArrowRight, BarChart3, Brain, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AdSkills</p>
              <p className="text-sm font-semibold text-slate-900">Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Open dashboard
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Skill Operations Platform</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-slate-900">
            Track AI skill usage with the clarity of a professional media operations console.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Monitor invocation trends, evaluate reliability, and manage access controls with
            clean analytics workflows built for teams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/demo"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              View demo dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Create account
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">Usage Intelligence</h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualize skill use over time with trend, mix, and team-level performance signals.
            </p>
          </Card>
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-slate-600" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">Risk Oversight</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review pending permissions and templates in one controlled operational flow.
            </p>
          </Card>
          <Card className="border border-slate-200 bg-white p-5 shadow-sm">
            <Brain className="h-5 w-5 text-slate-600" />
            <h2 className="mt-3 text-sm font-semibold text-slate-900">Actionable Insights</h2>
            <p className="mt-1 text-sm text-slate-500">
              Surface improvement opportunities and active alerts before they impact outcomes.
            </p>
          </Card>
        </section>
      </div>
    </main>
  );
}
