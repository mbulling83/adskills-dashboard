import { describe, expect, it } from "vitest";
import { getDemoUsageTotals } from "@/lib/dashboard-demo";

describe("getDemoUsageTotals", () => {
  it("aggregates each skill category independently", () => {
    const totals = getDemoUsageTotals([
      { date: "Apr 01", research: 2, analytics: 3, writing: 1, automation: 4 },
      { date: "Apr 02", research: 5, analytics: 1, writing: 2, automation: 0 },
    ]);

    expect(totals).toEqual({
      totalResearch: 7,
      totalAnalytics: 4,
      totalWriting: 3,
      totalAutomation: 4,
    });
  });
});
