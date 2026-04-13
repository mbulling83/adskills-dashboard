export type SkillUsagePoint = {
  date: string;
  research: number;
  analytics: number;
  writing: number;
  automation: number;
};

export type SkillMixPoint = {
  skill: string;
  invocations: number;
};

export type TeamAgentPoint = {
  agent: string;
  tasks: number;
  successRate: number;
};

export const demoSkillUsageOverTime: SkillUsagePoint[] = [
  { date: "Apr 01", research: 22, analytics: 16, writing: 12, automation: 9 },
  { date: "Apr 02", research: 18, analytics: 20, writing: 13, automation: 8 },
  { date: "Apr 03", research: 26, analytics: 18, writing: 11, automation: 10 },
  { date: "Apr 04", research: 30, analytics: 19, writing: 14, automation: 12 },
  { date: "Apr 05", research: 21, analytics: 17, writing: 12, automation: 9 },
  { date: "Apr 06", research: 24, analytics: 22, writing: 15, automation: 11 },
  { date: "Apr 07", research: 28, analytics: 24, writing: 16, automation: 13 },
];

export const demoSkillMix: SkillMixPoint[] = [
  { skill: "research-agent", invocations: 164 },
  { skill: "analytics-reviewer", invocations: 141 },
  { skill: "copy-polish", invocations: 96 },
  { skill: "workflow-automation", invocations: 88 },
  { skill: "creative-ideation", invocations: 72 },
];

export const demoTeamAgents: TeamAgentPoint[] = [
  { agent: "Growth Squad", tasks: 124, successRate: 96 },
  { agent: "Creative Ops", tasks: 108, successRate: 93 },
  { agent: "Analytics Pod", tasks: 134, successRate: 97 },
  { agent: "Lifecycle Team", tasks: 92, successRate: 91 },
];

export function getDemoUsageTotals(data: SkillUsagePoint[]) {
  return data.reduce(
    (acc, point) => {
      acc.totalResearch += point.research;
      acc.totalAnalytics += point.analytics;
      acc.totalWriting += point.writing;
      acc.totalAutomation += point.automation;
      return acc;
    },
    {
      totalResearch: 0,
      totalAnalytics: 0,
      totalWriting: 0,
      totalAutomation: 0,
    },
  );
}
