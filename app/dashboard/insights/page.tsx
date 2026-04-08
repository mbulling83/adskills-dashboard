import { createClient } from "@/lib/supabase/server";
import { Sparkles, Lightbulb, AlertTriangle, BarChart3, Shield, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InsightsPage() {
  const supabase = await createClient();

  // Fetch suggestions
  const { data: suggestions } = await supabase
    .from("suggestions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch active alerts
  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .in("status", ["active", "acknowledged"])
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch skill metrics
  const { data: skillMetrics } = await supabase
    .from("skill_metrics")
    .select("*")
    .order("total_invocations", { ascending: false })
    .limit(10);

  // Fetch recent permission tests
  const { data: permissionTests } = await supabase
    .from("permission_tests")
    .select("*")
    .order("tested_at", { ascending: false })
    .limit(10);

  // Fetch permission templates
  const { data: templates } = await supabase
    .from("permission_templates")
    .select("*")
    .eq("is_public", true);

  // Calculate summary stats
  const pendingSuggestions = suggestions?.length || 0;
  const activeAlerts = alerts?.filter(a => a.status === "active").length || 0;
  const avgSuccessRate = skillMetrics && skillMetrics.length > 0
    ? skillMetrics.reduce((sum, m) => sum + (m.success_rate || 0), 0) / skillMetrics.length
    : 0;
  const pendingTests = permissionTests?.filter(t => t.status === "pending_review").length || 0;

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
              className="text-sm font-medium text-foreground"
            >
              Insights
            </Link>
          </nav>
        </header>

        <div className="py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              AI-Powered Insights
            </h1>
            <p className="mt-2 text-muted-foreground">
              Intelligent suggestions, alerts, and performance metrics
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-6 sm:grid-cols-4 mb-8">
            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Suggestions
                  </p>
                  <p className="mt-2 text-3xl font-bold">{pendingSuggestions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <Lightbulb className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Alerts
                  </p>
                  <p className="mt-2 text-3xl font-bold">{activeAlerts}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Success Rate
                  </p>
                  <p className="mt-2 text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
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
                    Pending Tests
                  </p>
                  <p className="mt-2 text-3xl font-bold">{pendingTests}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Suggestions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">AI Suggestions</h2>
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <Card className="border-border/80 bg-card p-6">
                {suggestions && suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{suggestion.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.suggestion_type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.suggested_actions && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium">Suggested actions:</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(suggestion.suggested_actions) &&
                                suggestion.suggested_actions.map((action: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {action.action || action}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No suggestions yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      AI will generate suggestions based on your usage patterns
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Active Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Active Alerts</h2>
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <Card className="border-border/80 bg-card p-6">
                {alerts && alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-lg border ${
                          alert.severity === "critical" ? "border-destructive/50 bg-destructive/5" :
                          alert.severity === "warning" ? "border-yellow-500/50 bg-yellow-500/5" :
                          "border-border bg-background/50"
                        } p-4`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge
                            variant={alert.severity === "critical" ? "destructive" : "outline"}
                            className="text-xs capitalize"
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                          {alert.status === "active" && (
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-accent mb-4" />
                    <p className="text-lg font-medium">No active alerts</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      You're all clear! System is running smoothly
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Skill Performance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Skill Performance</h2>
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <Card className="border-border/80 bg-card p-6">
                {skillMetrics && skillMetrics.length > 0 ? (
                  <div className="space-y-3">
                    {skillMetrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{metric.skill_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {metric.total_invocations} invocations
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              {(metric.success_rate || 0).toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">success</p>
                          </div>
                          {(metric.success_rate || 0) >= 90 ? (
                            <CheckCircle2 className="h-5 w-5 text-accent" />
                          ) : (metric.success_rate || 0) >= 70 ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No metrics yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start using skills to see performance data
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Permission Tests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Permission Tests</h2>
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <Card className="border-border/80 bg-card p-6">
                {permissionTests && permissionTests.length > 0 ? (
                  <div className="space-y-3">
                    {permissionTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{test.permission_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {test.tool_name || "Unknown tool"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={test.test_result === "passed" ? "default" :
                                    test.test_result === "warning" ? "secondary" :
                                    "destructive"}
                            className="text-xs"
                          >
                            {test.test_result}
                          </Badge>
                          {test.status === "pending_review" && (
                            <Badge variant="outline" className="text-xs">
                              Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No tests yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Test permissions before granting them to ensure safety
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Permission Templates */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Permission Templates</h2>
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <Card className="border-border/80 bg-card p-6">
                {templates && templates.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.workflow_type.replace(/_/g, " ")}
                          </Badge>
                          {template.auto_apply && (
                            <Badge className="text-xs bg-accent/20 text-accent">
                              Auto-apply
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Permissions:</p>
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(JSON.parse(template.permissions as string)).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/_/g, " ")}</span>
                                <span className={value === "high" || value === "critical" ? "text-destructive" : ""}>
                                  {value as string}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No templates available</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Pre-configured permission templates will appear here
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
