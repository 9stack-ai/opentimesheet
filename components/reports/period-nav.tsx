import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type Period,
  type PeriodKind,
  monthPeriodOf,
  quarterPeriodOf,
  halfPeriodOf,
  yearPeriodOf,
  weekPeriod,
  shiftPeriod,
  periodParam,
} from "@/lib/period";

const KIND_LABEL: Record<PeriodKind, string> = {
  week: "Tuần",
  month: "Tháng",
  quarter: "Quý",
  half: "6 tháng",
  year: "Năm",
};

/** Period selector for report pages: prev/next within the current kind + presets that
 * switch kind (anchored to today). Server component — renders plain links, no client JS. */
export function PeriodNav({
  basePath,
  period,
  now,
}: {
  basePath: string;
  period: Period;
  now: Date;
}) {
  const prev = periodParam(shiftPeriod(period, -1));
  const next = periodParam(shiftPeriod(period, 1));
  const presets: { kind: PeriodKind; value: string }[] = [
    { kind: "week", value: weekPeriod(now).label },
    { kind: "month", value: monthPeriodOf(now).label },
    { kind: "quarter", value: quarterPeriodOf(now).label },
    { kind: "half", value: halfPeriodOf(now).label },
    { kind: "year", value: yearPeriodOf(now).label },
  ];
  const link = (key: string, value: string) => `${basePath}?${key}=${value}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-8" asChild>
          <Link href={link(prev.key, prev.value)} aria-label="Kỳ trước">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <span className="min-w-24 text-center text-sm font-medium">{period.label}</span>
        <Button variant="outline" size="icon" className="size-8" asChild>
          <Link href={link(next.key, next.value)} aria-label="Kỳ sau">
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {presets.map((p) => (
          <Button
            key={p.kind}
            variant={period.kind === p.kind ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={link(p.kind, p.value)}>{KIND_LABEL[p.kind]}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
