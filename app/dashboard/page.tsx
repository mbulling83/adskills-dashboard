import { createClient } from "@/lib/supabase/server";
import { UsageChart } from "@/components/UsageChart";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const avgDailyUsage = chartData.length
    ? Math.round(totalInvocations / chartData.length)
    : 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Last 30 days of skill invocation activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Invocations
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{totalInvocations}</p>
            <BarChart3 className="h-5 w-5 text-slate-500" />
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active Skills
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{activeSkills}</p>
            <TrendingUp className="h-5 w-5 text-slate-500" />
          </div>
        </Card>

        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Avg Daily Usage
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-3xl font-semibold text-slate-900">{avgDailyUsage}</p>
            <Zap className="h-5 w-5 text-slate-500" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Skill Use Over Time</h3>
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              30D
            </Badge>
          </div>
          <UsageChart data={chartData} />
        </Card>

        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top Skills</h3>
          {topSkills.length > 0 ? (
            <div className="space-y-2">
              {topSkills.slice(0, 8).map(([skill, count]) => (
                <div
                  key={skill}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="truncate text-sm text-slate-700">{skill}</p>
                  <p className="ml-3 text-sm font-semibold text-slate-900">{count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No usage data available yet.
            </p>
          )}
        </Card>
      </div>
    </section>
  );
}
