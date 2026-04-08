import { createClient } from "@/lib/supabase/server";
import { Sparkles, Activity, AlertCircle, Shield, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch sessions with telemetry
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(10);

  // Fetch recent tool detections
  const { data: toolDetections } = await supabase
    .from("tool_detections")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(10);

  // Fetch pending permission requests
  const { data: permissionRequests } = await supabase
    .from("permission_requests")
    .select("*")
    .eq("decision", "pending")
    .order("requested_at", { ascending: false })
    .limit(10);

  // Calculate summary stats
  const totalSessions = sessions?.length || 0;
  const totalInvocations = sessions?.reduce((sum, s) => sum + (s.total_invocations || 0), 0) || 0;
  const totalErrors = sessions?.reduce((sum, s) => sum + (s.total_errors || 0), 0) || 0;
  const pendingDetections = toolDetections?.filter(d => d.status === "pending").length || 0;
  const pendingPermissions = permissionRequests?.length || 0;

  // Group detections by platform
  const detectionsByPlatform = toolDetections?.reduce((acc, d) => {
    acc[d.platform_name] = (acc[d.platform_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Group permissions by risk level
  const permissionsByRisk = permissionRequests?.reduce((acc, p) => {
    acc[p.risk_level] = (acc[p.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

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
              className="text-sm font-medium text-foreground"
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
              Session Analytics & Insights
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your skill usage patterns, detected platforms, and permission analysis
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-6 sm:grid-cols-4 mb-8">
            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Sessions
                  </p>
                  <p className="mt-2 text-3xl font-bold">{totalSessions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Invocations
                  </p>
                  <p className="mt-2 text-3xl font-bold">{totalInvocations}</p>
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
                    Platform Detections
                  </p>
                  <p className="mt-2 text-3xl font-bold">{pendingDetections}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
            </Card>

            <Card className="border-border/80 bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Permissions
                  </p>
                  <p className="mt-2 text-3xl font-bold">{pendingPermissions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent/25">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Sessions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Recent Sessions</h2>
              <Card className="border-border/80 bg-card p-6">
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-start justify-between rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/25">
                            <Clock className="h-5 w-5 text-accent" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {session.session_id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Started {new Date(session.started_at).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {session.total_invocations || 0} invocations
                              </Badge>
                              {session.total_errors > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {session.total_errors} errors
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No sessions yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start tracking your sessions to see analytics here
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Tool Detections */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Platform Detections</h2>
              <Card className="border-border/80 bg-card p-6">
                {toolDetections && toolDetections.length > 0 ? (
                  <div className="space-y-4">
                    {(Object.entries(detectionsByPlatform) as [string, number][]).map(([platform, count]) => (
                      <div
                        key={platform}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/25">
                            <AlertCircle className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{platform.replace("_", " ")}</p>
                            <p className="text-sm text-muted-foreground">
                              {count} detection{count > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Badge className="rounded-full bg-accent/20 text-accent">
                          Detected
                        </Badge>
                      </div>
                    ))}
                    {toolDetections.slice(0, 5).map((detection) => (
                      <div
                        key={detection.id}
                        className="mt-4 p-4 rounded-lg bg-background/50 border border-border"
                      >
                        <p className="text-sm font-medium mb-2">
                          Suggested skills for {detection.platform_name.replace("_", " ")}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(detection.suggested_skills as string[]).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Confidence: {detection.confidence}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No platforms detected</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Use skills to detect advertising platforms
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Permission Requests */}
            <div className="space-y-4 lg:col-span-2">
              <h2 className="text-lg font-semibold">Permission Analysis</h2>
              <Card className="border-border/80 bg-card p-6">
                {permissionRequests && permissionRequests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {(Object.entries(permissionsByRisk) as [string, number][]).map(([risk, count]) => (
                        <div key={risk} className="text-center">
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-sm text-muted-foreground capitalize">{risk} risk</p>
                        </div>
                      ))}
                    </div>
                    {permissionRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-start justify-between rounded-lg border border-border bg-background/50 p-4 hover:border-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{request.permission_type}</p>
                            <Badge
                              variant={
                                request.risk_level === "high" || request.risk_level === "critical"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {request.risk_level} risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tool: {request.tool_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested {new Date(request.requested_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">Pending review</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No pending permissions</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Permission requests will appear here when tools require elevated access
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
