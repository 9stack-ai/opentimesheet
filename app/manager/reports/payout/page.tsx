import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
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

export default async function PayoutReportPage({
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

  const rows = payoutByUser(await approvedEntriesForPeriod(period));
  const grandTotal = rows.reduce((s, r) => s + r.payout, 0);
  const exportQuery = period.kind === "week" ? `week=${period.label}` : `month=${period.label}`;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Payout report</h1>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">Period: {period.label}</span>
        <Link href={`/manager/reports/payout?month=${monthPeriod(cy, cm).label}`} className="text-blue-700 underline">
          This month
        </Link>
        <Link href={`/manager/reports/payout?week=${weekPeriod(now).label}`} className="text-blue-700 underline">
          This week
        </Link>
        <a
          href={`/manager/reports/payout/export?${exportQuery}`}
          className="ml-auto rounded border border-gray-300 px-3 py-1"
        >
          Export CSV
        </a>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-3">Freelancer</th>
            <th className="py-2 pr-3">Hours</th>
            <th className="py-2 pr-3">Payout (VND)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-gray-100">
              <td className="py-2 pr-3">{r.userName}</td>
              <td className="py-2 pr-3">{r.totalHours}</td>
              <td className="py-2 pr-3">{formatVnd(r.payout)}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-2 text-gray-500">
                No approved time in this period.
              </td>
            </tr>
          ) : null}
        </tbody>
        {rows.length > 0 ? (
          <tfoot>
            <tr className="border-t border-gray-300 font-medium">
              <td className="py-2 pr-3">Total</td>
              <td className="py-2 pr-3" />
              <td className="py-2 pr-3">{formatVnd(grandTotal)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </section>
  );
}
