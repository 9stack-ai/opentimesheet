"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatVnd } from "@/lib/money";

const config = {
  revenue: { label: "Doanh thu", color: "var(--chart-2)" },
  cost: { label: "Chi phí", color: "var(--chart-5)" },
  net: { label: "Lợi nhuận", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function FinanceBarChart({ data }: { data: { label: string; revenue: number; cost: number; net: number }[] }) {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}tr`}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatVnd(Number(value))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
        <Bar dataKey="net" fill="var(--color-net)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
