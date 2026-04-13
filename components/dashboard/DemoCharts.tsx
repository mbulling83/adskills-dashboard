"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type {
  SkillMixPoint,
  SkillUsagePoint,
  TeamAgentPoint,
} from "@/lib/dashboard-demo";

const pieColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

export function SkillUsageLineChart({ data }: { data: SkillUsagePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="research" stroke="#0f172a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="analytics" stroke="#334155" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="writing" stroke="#64748b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="automation" stroke="#94a3b8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SkillMixPieChart({ data }: { data: SkillMixPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="invocations"
          nameKey="skill"
          cx="50%"
          cy="50%"
          outerRadius={95}
          innerRadius={52}
        >
          {data.map((entry, index) => (
            <Cell
              key={`${entry.skill}-${index}`}
              fill={pieColors[index % pieColors.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TeamPerformanceBarChart({ data }: { data: TeamAgentPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="agent" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748b" }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="tasks" fill="#0f172a" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="successRate" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
