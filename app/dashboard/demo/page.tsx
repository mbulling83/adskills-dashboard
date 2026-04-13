import { Card } from "@/components/ui/card";
import {
  demoSkillMix,
  demoSkillUsageOverTime,
  demoTeamAgents,
  getDemoUsageTotals,
} from "@/lib/dashboard-demo";
import {
  SkillMixPieChart,
  SkillUsageLineChart,
  TeamPerformanceBarChart,
} from "@/components/dashboard/DemoCharts";

export default function DemoDashboardPage() {
  const totals = getDemoUsageTotals(demoSkillUsageOverTime);
  const totalInvocations =
    totals.totalResearch +
    totals.totalAnalytics +
    totals.totalWriting +
    totals.totalAutomation;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Demo Workspace</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sample metrics showing how teams can track different skill categories.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Invocations</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{totalInvocations}</p>
        </Card>
        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Research Usage</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{totals.totalResearch}</p>
        </Card>
        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Analytics Usage</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{totals.totalAnalytics}</p>
        </Card>
        <Card className="border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Automation Usage</p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{totals.totalAutomation}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Skill Use Over Time</h3>
          <SkillUsageLineChart data={demoSkillUsageOverTime} />
        </Card>

        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Skill Mix</h3>
          <SkillMixPieChart data={demoSkillMix} />
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Team Performance</h3>
        <TeamPerformanceBarChart data={demoTeamAgents} />
      </Card>
    </section>
  );
}
