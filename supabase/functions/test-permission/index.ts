import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface PermissionTest {
  permission_type: string;
  tool_name?: string;
  test_data: any;
  expected_impact: any;
}

async function testPermissionInSandbox(permission: PermissionTest) {
  // Simulate sandbox testing
  const results = {
    test_type: "sandbox",
    test_data: permission.test_data,
    expected_impact: permission.expected_impact,
    actual_impact: {} as any,
    test_result: "passed" as "passed" | "failed" | "warning",
    risk_assessment: {} as any
  };

  // Simulate different permission types
  switch (permission.permission_type) {
    case "file_read":
      results.actual_impact = {
        files_accessed: permission.test_data?.files?.length || 0,
        data_read: "readonly",
        modification: false
      };
      results.risk_assessment = {
        data_destruction: false,
        data_exfiltration: "low",
        system_stability: "no_impact"
      };
      break;

    case "file_write":
      results.actual_impact = {
        files_modified: permission.test_data?.files?.length || 0,
        data_written: true,
        backup_created: false
      };
      results.risk_assessment = {
        data_destruction: "low",
        data_exfiltration: "none",
        system_stability: "minimal_impact"
      };
      if (permission.test_data?.files?.some((f: string) => f.includes("/"))) {
        results.test_result = "warning";
        results.risk_assessment.data_destruction = "medium";
      }
      break;

    case "bash_execute":
      results.actual_impact = {
        commands_executed: permission.test_data?.commands?.length || 0,
        execution_success: true,
        system_impact: "variable"
      };
      results.risk_assessment = {
        data_destruction: "high",
        data_exfiltration: "high",
        system_stability: "potential_impact"
      };
      results.test_result = "warning";
      break;

    case "api_call":
      results.actual_impact = {
        external_calls: permission.test_data?.endpoints?.length || 0,
        data_sent: permission.test_data?.data_size || 0,
        rate_limit: "not_exceeded"
      };
      results.risk_assessment = {
        data_destruction: "none",
        data_exfiltration: "medium",
        system_stability: "no_impact"
      };
      break;

    case "file_delete":
      results.actual_impact = {
        files_deleted: permission.test_data?.files?.length || 0,
        recovery_possible: false,
        backup_exists: permission.test_data?.backup || false
      };
      results.risk_assessment = {
        data_destruction: "high",
        data_exfiltration: "none",
        system_stability: "minimal_impact"
      };
      if (!permission.test_data?.backup) {
        results.test_result = "warning";
      }
      break;

    default:
      results.actual_impact = { unknown: true };
      results.risk_assessment = {
        data_destruction: "unknown",
        data_exfiltration: "unknown",
        system_stability: "unknown"
      };
      results.test_result = "warning";
  }

  return results;
}

async function validatePermission(permission: PermissionTest) {
  // Validate permission against security policies
  const validation = {
    test_type: "validation",
    test_data: permission.test_data,
    expected_impact: permission.expected_impact,
    actual_impact: {},
    test_result: "passed" as "passed" | "failed" | "warning",
    risk_assessment: {}
  };

  const violations = [];

  // Check for common security violations
  if (permission.test_data) {
    // Check for path traversal attempts
    if (permission.permission_type.includes("file")) {
      const files = permission.test_data.files || [];
      const hasPathTraversal = files.some((f: string) =>
        f.includes("../") || f.includes("..\\")
      );
      if (hasPathTraversal) {
        violations.push("path_traversal_detected");
        validation.test_result = "failed";
      }
    }

    // Check for command injection
    if (permission.permission_type === "bash_execute") {
      const commands = permission.test_data.commands || [];
      const hasSuspiciousCommands = commands.some((c: string) =>
        c.includes("rm -rf") || c.includes("del /") || c.includes("format")
      );
      if (hasSuspiciousCommands) {
        violations.push("dangerous_command_detected");
        validation.test_result = "failed";
      }
    }

    // Check for suspicious API calls
    if (permission.permission_type === "api_call") {
      const endpoints = permission.test_data.endpoints || [];
      const hasNonHttps = endpoints.some((e: string) => !e.startsWith("https://"));
      if (hasNonHttps) {
        violations.push("insecure_endpoint_detected");
        validation.test_result = "warning";
      }
    }
  }

  validation.actual_impact = {
    violations,
    security_checks: "completed",
    compliance: violations.length === 0 ? "passed" : "failed"
  };

  validation.risk_assessment = {
    security_risk: violations.length > 0 ? "high" : "low",
    compliance_risk: violations.length > 0 ? "high" : "low",
    recommendation: violations.length === 0 ? "approve" : "review_required"
  };

  return validation;
}

async function assessImpact(permission: PermissionTest) {
  // Assess broader impact of permission
  const assessment = {
    test_type: "impact_assessment",
    test_data: permission.test_data,
    expected_impact: permission.expected_impact,
    actual_impact: {},
    test_result: "passed" as "passed" | "failed" | "warning",
    risk_assessment: {}
  };

  // Simulate impact assessment
  assessment.actual_impact = {
    scope: permission.test_data?.scope || "limited",
    duration: permission.test_data?.duration || "transient",
    reversibility: permission.test_data?.reversible || "unknown",
    collateral_effects: []
  };

  const riskScore = {
    data_sensitivity: 0,
    system_criticality: 0,
    recovery_difficulty: 0
  };

  // Calculate risk score
  if (permission.permission_type.includes("delete")) {
    riskScore.data_sensitivity = 3;
    riskScore.system_criticality = 2;
    riskScore.recovery_difficulty = 3;
  } else if (permission.permission_type.includes("write")) {
    riskScore.data_sensitivity = 2;
    riskScore.system_criticality = 1;
    riskScore.recovery_difficulty = 2;
  } else if (permission.permission_type.includes("execute")) {
    riskScore.data_sensitivity = 3;
    riskScore.system_criticality = 3;
    riskScore.recovery_difficulty = 2;
  }

  const totalRisk = riskScore.data_sensitivity + riskScore.system_criticality + riskScore.recovery_difficulty;

  assessment.risk_assessment = {
    overall_risk: totalRisk <= 3 ? "low" : totalRisk <= 6 ? "medium" : "high",
    risk_factors: riskScore,
    recommendation: totalRisk <= 3 ? "safe_to_approve" : totalRisk <= 6 ? "review_recommended" : "high_risk_caution"
  };

  if (totalRisk > 6) {
    assessment.test_result = "warning";
  }

  return assessment;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const plainToken = authHeader.slice(7);
  const tokenHash = await sha256hex(plainToken);

  const { data: tokenRow } = await supabase
    .from("api_tokens")
    .select("id, org_id, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (!tokenRow || tokenRow.revoked_at) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    permissions?: Array<{
      permission_type: string;
      tool_name?: string;
      test_data?: any;
      expected_impact?: any;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (!body.permissions || body.permissions.length === 0) {
    return new Response("permissions required", { status: 400 });
  }

  const results = [];

  for (const permission of body.permissions) {
    // Run all three test types
    const sandboxTest = await testPermissionInSandbox(permission);
    const validationTest = await validatePermission(permission);
    const impactAssessment = await assessImpact(permission);

    const overallResult =
      sandboxTest.test_result === "failed" ||
      validationTest.test_result === "failed" ? "failed" :
      sandboxTest.test_result === "warning" ||
      validationTest.test_result === "warning" ||
      impactAssessment.test_result === "warning" ? "warning" : "passed";

    // Insert test result
    const { data: testResult } = await supabase
      .from("permission_tests")
      .insert({
        org_id: tokenRow.org_id,
        permission_type: permission.permission_type,
        tool_name: permission.tool_name,
        test_type: "comprehensive",
        test_data: permission.test_data,
        expected_impact: permission.expected_impact,
        actual_impact: {
          sandbox: sandboxTest.actual_impact,
          validation: validationTest.actual_impact,
          impact: impactAssessment.actual_impact
        },
        test_result: overallResult,
        risk_assessment: {
          sandbox: sandboxTest.risk_assessment,
          validation: validationTest.risk_assessment,
          impact: impactAssessment.risk_assessment
        },
        status: "pending_review"
      })
      .select()
      .single();

    results.push({
      permission: permission.permission_type,
      result: overallResult,
      tests: {
        sandbox: sandboxTest,
        validation: validationTest,
        impact: impactAssessment
      },
      test_id: testResult?.id
    });
  }

  return new Response(JSON.stringify({
    tested: results.length,
    results
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
