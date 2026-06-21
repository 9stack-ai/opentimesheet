"use client";

import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
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
  revenue: { label: "Nguồn thu", color: "var(--chart-2)" },
  cost: { label: "Chi thực", color: "var(--chart-5)" },
  net: { label: "Số dư", color: "var(--chart-1)" },
} satisfies ChartConfig;

const RANGES = [
  { value: "3", label: "3 tháng gần nhất" },
  { value: "6", label: "6 tháng gần nhất" },
  { value: "12", label: "12 tháng gần nhất" },
];

export function FinanceChartCard({ data }: { data: Point[] }) {
  const [range, setRange] = React.useState("6");
  const sliced = data.slice(Math.max(0, data.length - Number(range)));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Nguồn thu · Chi thực · Số dư</CardTitle>
          <CardDescription>Theo tháng, dựa trên tiền thực vào/ra (Nguồn thu &amp; Thực chi).</CardDescription>
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
          <ComposedChart accessibilityLayer data={sliced} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cost)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-cost)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
            <Area
              dataKey="cost"
              type="monotone"
              fill="url(#fillCost)"
              stroke="var(--color-cost)"
              strokeWidth={2}
            />
            <Line
              dataKey="net"
              type="monotone"
              stroke="var(--color-net)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
