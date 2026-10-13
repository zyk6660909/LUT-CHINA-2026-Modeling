"use client";
import {
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts";

export interface RadarDatum {
  label: string;
  score: number;
}

export function RadarChart({
  data,
  baseline,
  height = 340,
}: {
  data: RadarDatum[];
  baseline: number[];
  height?: number;
}) {
  const rows = data.map((d, i) => ({
    dim: d.label,
    score: d.score,
    baseline: baseline[i] ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke="#e4e4e7" />
        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: "#3f3f46" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#a1a1aa" }} />
        <Radar
          name="本项目"
          dataKey="score"
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Radar
          name="往届金奖均值"
          dataKey="baseline"
          stroke="#94a3b8"
          fill="#94a3b8"
          fillOpacity={0.12}
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
