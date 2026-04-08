import { createClient } from "@/lib/supabase/server";
import { Sparkles, Key, AlertTriangle } from "lucide-react";
import Link from "next/link";
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
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/tokens"
              className="text-sm font-medium text-foreground"
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
              API Tokens
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your API tokens for accessing AdSkills services
            </p>
          </div>

          {tokens && tokens.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Active Tokens */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/25">
                    <Key className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold">Active Tokens</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTokens.length} active
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeTokens.map((t) => (
                    <Card
                      key={t.id}
                      className="border-border/80 bg-card p-5 hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-base">{t.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(t.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="rounded-full bg-accent/20 text-accent px-3 py-1 text-xs">
                          Active
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Revoked Tokens */}
              {revokedTokens.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Revoked Tokens</p>
                      <p className="text-sm text-muted-foreground">
                        {revokedTokens.length} revoked
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {revokedTokens.map((t) => (
                      <Card
                        key={t.id}
                        className="border-border/60 bg-muted/30 p-5 opacity-75"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-base text-muted-foreground">
                              {t.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Revoked {new Date(t.revoked_at!).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs">
                            Revoked
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <Card className="border-border/80 bg-card p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-accent/25">
                  <Key className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold">No tokens yet</h2>
                <p className="mt-4 max-w-md text-base text-muted-foreground">
                  You don't have any API tokens yet. Contact your administrator to generate tokens for accessing AdSkills services.
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
