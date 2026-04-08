import { describe, it, expect } from "vitest";
import { classifyPermissionRisk, isHighRisk } from "@/lib/permission-risk";

describe("classifyPermissionRisk", () => {
  describe("low risk", () => {
    it("classifies file_read as low risk readonly", () => {
      const result = classifyPermissionRisk("file_read");
      expect(result.risk).toBe("low");
      expect(result.impact).toBe("readonly");
    });

    it("classifies environment_read as low risk readonly", () => {
      const result = classifyPermissionRisk("environment_read");
      expect(result.risk).toBe("low");
      expect(result.impact).toBe("readonly");
    });
  });

  describe("medium risk", () => {
    it("classifies file_write as medium risk", () => {
      const result = classifyPermissionRisk("file_write");
      expect(result.risk).toBe("medium");
      expect(result.impact).toBe("data_modification");
    });

    it("classifies api_call as medium risk", () => {
      const result = classifyPermissionRisk("api_call");
      expect(result.risk).toBe("medium");
      expect(result.impact).toBe("external_access");
    });

    it("classifies database_query as medium risk", () => {
      const result = classifyPermissionRisk("database_query");
      expect(result.risk).toBe("medium");
      expect(result.impact).toBe("data_access");
    });
  });

  describe("high risk", () => {
    it("classifies bash_execute as high risk", () => {
      const result = classifyPermissionRisk("bash_execute");
      expect(result.risk).toBe("high");
      expect(result.impact).toBe("system_execution");
    });

    it("classifies network_request as high risk", () => {
      const result = classifyPermissionRisk("network_request");
      expect(result.risk).toBe("high");
      expect(result.impact).toBe("external_access");
    });
  });

  describe("critical risk", () => {
    it("classifies file_delete as critical", () => {
      const result = classifyPermissionRisk("file_delete");
      expect(result.risk).toBe("critical");
      expect(result.impact).toBe("data_destruction");
    });

    it("classifies git_push as critical", () => {
      const result = classifyPermissionRisk("git_push");
      expect(result.risk).toBe("critical");
      expect(result.impact).toBe("code_deployment");
    });

    it("classifies database_write as critical", () => {
      const result = classifyPermissionRisk("database_write");
      expect(result.risk).toBe("critical");
      expect(result.impact).toBe("data_modification");
    });
  });

  describe("unknown permissions", () => {
    it("defaults unknown permissions to medium risk", () => {
      const result = classifyPermissionRisk("some_unknown_permission");
      expect(result.risk).toBe("medium");
      expect(result.impact).toBe("unknown");
    });
  });
});

describe("isHighRisk", () => {
  it("returns true for high risk permissions", () => {
    expect(isHighRisk("bash_execute")).toBe(true);
    expect(isHighRisk("network_request")).toBe(true);
  });

  it("returns true for critical risk permissions", () => {
    expect(isHighRisk("file_delete")).toBe(true);
    expect(isHighRisk("git_push")).toBe(true);
    expect(isHighRisk("database_write")).toBe(true);
  });

  it("returns false for low risk permissions", () => {
    expect(isHighRisk("file_read")).toBe(false);
    expect(isHighRisk("environment_read")).toBe(false);
  });

  it("returns false for medium risk permissions", () => {
    expect(isHighRisk("file_write")).toBe(false);
    expect(isHighRisk("api_call")).toBe(false);
  });
});
