"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatVnd } from "@/lib/money";

type Point = { label: string; revenue: number; cost: number; net: number };

const config = {
  revenue: { label: "Doanh thu", color: "var(--chart-2)" },
  cost: { label: "Chi phí", color: "var(--chart-5)" },
  net: { label: "Lợi nhuận", color: "var(--chart-1)" },
} satisfies ChartConfig;

const RANGES = [
  { value: "3", label: "3 tháng gần nhất" },
  { value: "6", label: "6 tháng gần nhất" },
  { value: "12", label: "12 tháng gần nhất" },
];

export function FinanceChartCard({ data }: { data: Point[] }) {
  const [range, setRange] = React.useState("6");
  const n = Number(range);
  const sliced = data.slice(Math.max(0, data.length - n));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Doanh thu · Chi phí · Lợi nhuận</CardTitle>
          <CardDescription>Theo tháng, dựa trên giờ công đã duyệt + chi phí.</CardDescription>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px]" aria-label="Khoảng thời gian">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={sliced} margin={{ left: 4, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}tr`}
            />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatVnd(Number(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" fill="var(--color-net)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
