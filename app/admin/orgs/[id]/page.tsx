import { createClient } from "@/lib/supabase/server";
import { TokenManager } from "./TokenManager";

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
      <h1 className="text-2xl font-bold">{org?.name}</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">API Tokens</h2>
        <TokenManager orgId={id} tokens={tokens ?? []} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        {events && events.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1">Skill</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 font-mono">{e.skill_name}</td>
                  <td className="text-muted-foreground">
                    {new Date(e.invoked_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        )}
      </section>
    </div>
  );
}
