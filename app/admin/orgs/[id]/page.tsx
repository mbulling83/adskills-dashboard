import { createClient } from "@/lib/supabase/server";
import { TokenManager } from "./TokenManager";
import { Card } from "@/components/ui/card";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: org }, { data: tokens }, { data: events }] = await Promise.all([
    supabase.from("orgs").select("*").eq("id", id).single(),
    supabase
      .from("api_tokens")
      .select("*")
      .eq("org_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("skill_events")
      .select("skill_name, invoked_at")
      .eq("org_id", id)
      .order("invoked_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{org?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Organization details and recent activity.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">API Tokens</h2>
        <TokenManager orgId={id} tokens={tokens ?? []} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Activity</h2>
        {events && events.length > 0 ? (
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Skill</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-slate-800">{e.skill_name}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(e.invoked_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
      </section>
    </div>
  );
}
