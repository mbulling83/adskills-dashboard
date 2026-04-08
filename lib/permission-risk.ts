export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ImpactType =
  | "readonly"
  | "data_modification"
  | "external_access"
  | "data_access"
  | "system_execution"
  | "data_destruction"
  | "code_deployment"
  | "unknown";

export interface RiskClassification {
  risk: RiskLevel;
  impact: ImpactType;
}

const PERMISSION_RISK_MAP: Record<string, RiskClassification> = {
  file_read:        { risk: "low",      impact: "readonly" },
  environment_read: { risk: "low",      impact: "readonly" },
  file_write:       { risk: "medium",   impact: "data_modification" },
  api_call:         { risk: "medium",   impact: "external_access" },
  database_query:   { risk: "medium",   impact: "data_access" },
  bash_execute:     { risk: "high",     impact: "system_execution" },
  network_request:  { risk: "high",     impact: "external_access" },
  file_delete:      { risk: "critical", impact: "data_destruction" },
  git_push:         { risk: "critical", impact: "code_deployment" },
  database_write:   { risk: "critical", impact: "data_modification" },
};

export function classifyPermissionRisk(permissionType: string): RiskClassification {
  return PERMISSION_RISK_MAP[permissionType] ?? { risk: "medium", impact: "unknown" };
}

export function isHighRisk(permissionType: string): boolean {
  const { risk } = classifyPermissionRisk(permissionType);
  return risk === "high" || risk === "critical";
}
