import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function OrgTokensPage() {
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("api_tokens")
    .select("id, label, created_at, revoked_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">API Tokens</h1>
      <p className="text-sm text-muted-foreground">
        Contact your administrator to generate new tokens.
      </p>
      {tokens?.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between p-3 border rounded"
        >
          <div>
            <span className="font-medium text-sm">{t.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {new Date(t.created_at).toLocaleDateString()}
            </span>
          </div>
          {t.revoked_at ? (
            <Badge variant="destructive">Revoked</Badge>
          ) : (
            <Badge>Active</Badge>
          )}
        </div>
      ))}
      {(!tokens || tokens.length === 0) && (
        <p className="text-sm text-muted-foreground">No tokens found.</p>
      )}
    </div>
  );
}
