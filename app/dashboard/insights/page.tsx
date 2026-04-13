import { createClient } from "@/lib/supabase/server";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  Shield,
  XCircle,
} from "lucide-react";
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
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Insights</h2>
        <p className="mt-1 text-sm text-slate-500">
          AI recommendations, alerts, and skill quality.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending Suggestions", value: pendingSuggestions, icon: Lightbulb },
          { label: "Active Alerts", value: activeAlerts, icon: AlertTriangle },
          { label: "Avg Success Rate", value: `${avgSuccessRate.toFixed(1)}%`, icon: BarChart3 },
          { label: "Pending Tests", value: pendingTests, icon: Shield },
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
          <h3 className="mb-4 text-sm font-semibold text-slate-900">AI Suggestions</h3>
          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{suggestion.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {suggestion.suggestion_type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{suggestion.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No suggestions yet.</p>
          )}
        </Card>

        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Active Alerts</h3>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                    <Badge variant={alert.severity === "critical" ? "destructive" : "outline"}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mt-2 text-sm text-slate-500">No active alerts.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Skill Performance</h3>
          {skillMetrics && skillMetrics.length > 0 ? (
            <div className="space-y-2">
              {skillMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{metric.skill_name}</p>
                    <p className="text-xs text-slate-500">{metric.total_invocations} invocations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {(metric.success_rate || 0).toFixed(0)}%
                    </p>
                    {(metric.success_rate || 0) >= 90 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (metric.success_rate || 0) >= 70 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No metrics yet.</p>
          )}
        </Card>

        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Permission Templates</h3>
          {templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{template.name}</p>
                    <Badge variant="outline">{template.workflow_type.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No templates available.</p>
          )}
        </Card>
      </div>
    </section>
  );
}
