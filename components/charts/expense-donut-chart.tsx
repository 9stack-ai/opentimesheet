"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatVnd } from "@/lib/money";

type Slice = { key: string; label: string; value: number };

const config = {
  payout: { label: "Chi trả nhân sự", color: "var(--chart-1)" },
  regular: { label: "Chi phí thường", color: "var(--chart-2)" },
  irregular: { label: "Chi bất thường", color: "var(--chart-4)" },
  fixed: { label: "Chi phí cố định", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function ExpenseDonutChart({ data }: { data: Slice[] }) {
  const slices = data.filter((d) => d.value > 0);

  if (slices.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">Chưa có khoản chi nào trong kỳ.</p>
    );
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[260px]">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="key" formatter={(value) => formatVnd(Number(value))} />}
        />
        <Pie data={slices} dataKey="value" nameKey="key" innerRadius={60} strokeWidth={2}>
          {slices.map((s) => (
            <Cell key={s.key} fill={`var(--color-${s.key})`} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} className="flex-wrap" />
      </PieChart>
    </ChartContainer>
  );
}
