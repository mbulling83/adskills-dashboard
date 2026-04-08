import { createClient } from "@/lib/supabase/server";
import { UsageChart } from "@/components/UsageChart";
import { Sparkles, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function OrgDashboardPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  // Read from session_events (telemetry system) — skill invocations only
  const { data: events } = await supabase
    .from("session_events")
    .select("skill_name, timestamp")
    .eq("event_type", "skill_invocation")
    .gte("timestamp", since)
    .order("timestamp", { ascending: true });

  const byDay: Record<string, number> = {};
  const bySkill: Record<string, number> = {};

  for (const e of events ?? []) {
    if (!e.skill_name) continue;
    const day = (e.timestamp as string).slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    bySkill[e.skill_name] = (bySkill[e.skill_name] ?? 0) + 1;
  }

  const chartData = Object.entries(byDay).map(([date, count]) => ({
    date,
    count,
  }));
  const topSkills = Object.entries(bySkill).sort((a, b) => b[1] - a[1]);
  const totalInvocations = events?.length ?? 0;
  const activeSkills = topSkills.length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-border py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-foreground text-background">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.64rem] uppercase tracking-[0.34em] text-muted-foreground">
                AdSkills
              </p>
              <p className="text-sm font-medium">Dashboard</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/tokens"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              API Tokens
            </Link>
            <Link
              href="/dashboard/analytics"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Analytics
            </Link>
            <Link
              href="/dashboard/insights"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Insights
            </Link>
          </nav>
        </header>

        <div className="py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Your Usage — Last 30 Days
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your skill invocations and performance metrics
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Invocations
                  </p>
                  <p className="mt-2 text-4xl font-bold">{totalInvocations}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Skills
                  </p>
                  <p className="mt-2 text-4xl font-bold">{activeSkills}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-4xl font-bold">Active</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chart */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Daily Activity</h2>
              <Card className="border-border/80 bg-card p-6">
                <UsageChart data={chartData} />
              </Card>
            </div>

            {/* Top Skills */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Top Skills</h2>
              <Card className="border-border/80 bg-card p-6">
                {topSkills.length > 0 ? (
                  <div className="space-y-3">
                    {topSkills.slice(0, 10).map(([skill, count], index) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/25 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">{skill}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-xs text-muted-foreground">
                            calls
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-accent/25">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">No activity yet</p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Start using skills to see your usage data here
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
