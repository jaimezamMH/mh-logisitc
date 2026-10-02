"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function CicloPorMesChart({
  data,
}: {
  data: { mes: string; promedioDias: number | null; cantidad: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--ink-muted)" }} axisLine={{ stroke: "var(--gray-200)" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--ink-muted)" }}
            axisLine={false}
            tickLine={false}
            label={{ value: "días", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--ink-muted)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--gray-100)" }}
            contentStyle={{ borderRadius: 8, borderColor: "var(--border)", fontSize: 13 }}
            formatter={(value, _name, entry) => {
              const cantidad = (entry?.payload as { cantidad?: number } | undefined)?.cantidad ?? 0;
              return [`${value} días (${cantidad} ventas)`, "Ciclo promedio"];
            }}
          />
          <Bar dataKey="promedioDias" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
