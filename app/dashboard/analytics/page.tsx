import { createClient } from "@/lib/supabase/server";
import { Activity, AlertCircle, Clock, Shield, TrendingUp } from "lucide-react";
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
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Session telemetry, platform detections, and permission requests.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Sessions", value: totalSessions, icon: Activity },
          { label: "Total Invocations", value: totalInvocations, icon: TrendingUp },
          { label: "Platform Detections", value: pendingDetections, icon: AlertCircle },
          { label: "Pending Permissions", value: pendingPermissions, icon: Shield },
        ].map((stat) => (
          <Card key={stat.label} className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <stat.icon className="h-5 w-5 text-slate-500" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Recent Sessions</h3>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {session.session_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(session.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.total_invocations || 0} calls</Badge>
                    {(session.total_errors || 0) > 0 && (
                      <Badge variant="destructive">{session.total_errors} errors</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No sessions yet.</p>
          )}
        </Card>

        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Detections by Platform</h3>
          {toolDetections && toolDetections.length > 0 ? (
            <div className="space-y-2">
              {(Object.entries(detectionsByPlatform) as [string, number][]).map(
                ([platform, count]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-sm capitalize text-slate-700">
                      {platform.replaceAll("_", " ")}
                    </p>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No platform detections yet.</p>
          )}
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Permission Queue</h3>
        {permissionRequests && permissionRequests.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(permissionsByRisk) as [string, number][]).map(([risk, count]) => (
                <Badge key={risk} variant="outline" className="capitalize">
                  {risk} risk: {count}
                </Badge>
              ))}
            </div>
            {permissionRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{request.permission_type}</p>
                  <p className="text-xs text-slate-500">
                    {request.tool_name || "Unknown"} - {new Date(request.requested_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={
                    request.risk_level === "high" || request.risk_level === "critical"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {request.risk_level}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No pending permission requests.</p>
        )}
      </Card>
    </section>
  );
}
