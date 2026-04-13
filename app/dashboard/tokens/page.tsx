import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function OrgTokensPage() {
  const supabase = await createClient();
  const { data: tokens } = await supabase
    .from("api_tokens")
    .select("id, label, created_at, revoked_at")
    .order("created_at", { ascending: false });

  const activeTokens = tokens?.filter(t => !t.revoked_at) ?? [];
  const revokedTokens = tokens?.filter(t => t.revoked_at) ?? [];

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">API Tokens</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage tokens used to access AdSkills services.
        </p>
      </div>

      {tokens && tokens.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100">
                <Key className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Active Tokens</p>
                <p className="text-xs text-slate-500">{activeTokens.length} active</p>
              </div>
            </div>
            <div className="space-y-2">
              {activeTokens.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-slate-900 text-white">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100">
                <AlertTriangle className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Revoked Tokens</p>
                <p className="text-xs text-slate-500">{revokedTokens.length} revoked</p>
              </div>
            </div>
            <div className="space-y-2">
              {revokedTokens.length > 0 ? (
                revokedTokens.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.label}</p>
                      <p className="text-xs text-slate-500">
                        Revoked {new Date(t.revoked_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Revoked</Badge>
                  </div>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">
                  No revoked tokens.
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100">
            <Key className="h-5 w-5 text-slate-700" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No tokens yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Contact your administrator to generate API tokens.
          </p>
        </Card>
      )}
    </section>
  );
}
