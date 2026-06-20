import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { profitabilityForPeriod } from "@/lib/profitability-db";
import { formatVnd } from "@/lib/money";
import {
  monthPeriod,
  weekPeriod,
  monthPeriodFromString,
  weekPeriodFromString,
  type Period,
} from "@/lib/period";
import { nowSaigon } from "@/lib/clock";

export const dynamic = "force-dynamic";

export default async function ProfitabilityReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; week?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const now = nowSaigon();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;

  let period: Period;
  if (sp.week) period = weekPeriodFromString(sp.week) ?? weekPeriod(now);
  else if (sp.month) period = monthPeriodFromString(sp.month) ?? monthPeriod(cy, cm);
  else period = monthPeriod(cy, cm);

  const { perProject, company } = await profitabilityForPeriod(period);
  const isMonthly = period.kind === "month";
  const exportQuery = isMonthly ? `month=${period.label}` : `week=${period.label}`;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Profitability</h1>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">
          Period: {period.label}
          {isMonthly ? "" : " (weekly = gross margin, no fixed-cost allocation)"}
        </span>
        <Link href={`/manager/reports/profitability?month=${monthPeriod(cy, cm).label}`} className="text-blue-700 underline">
          This month
        </Link>
        <Link href={`/manager/reports/profitability?week=${weekPeriod(now).label}`} className="text-blue-700 underline">
          This week
        </Link>
        <a
          href={`/manager/reports/profitability/export?${exportQuery}`}
          className="ml-auto rounded border border-gray-300 px-3 py-1"
        >
          Export CSV
        </a>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-3">Project</th>
            <th className="py-2 pr-3">Hours</th>
            <th className="py-2 pr-3">Revenue</th>
            <th className="py-2 pr-3">Direct cost</th>
            {isMonthly ? <th className="py-2 pr-3">Fixed (alloc)</th> : null}
            <th className="py-2 pr-3">Net</th>
          </tr>
        </thead>
        <tbody>
          {perProject.map((p) => (
            <tr key={p.projectId} className="border-b border-gray-100">
              <td className="py-2 pr-3">{p.projectName}</td>
              <td className="py-2 pr-3">{p.approvedHours}</td>
              <td className="py-2 pr-3">{formatVnd(p.revenue)}</td>
              <td className="py-2 pr-3">{formatVnd(p.directCost)}</td>
              {isMonthly ? <td className="py-2 pr-3">{formatVnd(p.allocatedFixed)}</td> : null}
              <td className={`py-2 pr-3 ${p.net < 0 ? "text-red-700" : ""}`}>{formatVnd(p.net)}</td>
            </tr>
          ))}
          {perProject.length === 0 ? (
            <tr>
              <td colSpan={isMonthly ? 6 : 5} className="py-2 text-gray-500">
                No approved time in this period.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="rounded border border-gray-200 p-4 text-sm">
        <h2 className="mb-2 font-medium">Company {isMonthly ? "net" : "gross margin"}</h2>
        <dl className="grid grid-cols-2 gap-1">
          <dt>Revenue</dt>
          <dd className="text-right">{formatVnd(company.revenue)}</dd>
          <dt>Direct cost</dt>
          <dd className="text-right">{formatVnd(company.directCost)}</dd>
          {isMonthly ? (
            <>
              <dt>Fixed costs</dt>
              <dd className="text-right">{formatVnd(company.totalFixed)}</dd>
            </>
          ) : null}
          <dt>Company expenses</dt>
          <dd className="text-right">{formatVnd(company.companyExpenses)}</dd>
          <dt className="font-medium">Net</dt>
          <dd className={`text-right font-medium ${company.net < 0 ? "text-red-700" : ""}`}>
            {formatVnd(company.net)}
          </dd>
        </dl>
      </div>
    </section>
  );
}
