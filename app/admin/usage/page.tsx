import { createClient } from "@/lib/supabase/server";
import { UsageChart } from "@/components/UsageChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminUsagePage() {
  const supabase = await createClient();

  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: events } = await supabase
    .from("skill_events")
    .select("skill_name, invoked_at, org_id, orgs(name)")
    .gte("invoked_at", since)
    .order("invoked_at", { ascending: true });

  const byDay: Record<string, number> = {};
  const bySkill: Record<string, number> = {};
  const byOrg: Record<string, number> = {};

  for (const e of events ?? []) {
    const day = e.invoked_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
    bySkill[e.skill_name] = (bySkill[e.skill_name] ?? 0) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgName = (e as any).orgs?.name ?? e.org_id;
    byOrg[orgName] = (byOrg[orgName] ?? 0) + 1;
  }

  const chartData = Object.entries(byDay).map(([date, count]) => ({
    date,
    count,
  }));
  const topSkills = Object.entries(bySkill)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topOrgs = Object.entries(byOrg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usage — Last 30 Days</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Invocations</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {topSkills.length > 0 ? (
              topSkills.map(([skill, count]) => (
                <div key={skill} className="flex justify-between py-1 text-sm">
                  <span className="font-mono">{skill}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Active Orgs</CardTitle>
          </CardHeader>
          <CardContent>
            {topOrgs.length > 0 ? (
              topOrgs.map(([org, count]) => (
                <div key={org} className="flex justify-between py-1 text-sm">
                  <span>{org}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
