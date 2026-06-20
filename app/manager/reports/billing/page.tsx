import Link from "next/link";
import { requireManager } from "@/lib/rbac";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { billingByClient } from "@/lib/reporting";
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

export default async function BillingReportPage({
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

  const clients = billingByClient(await approvedEntriesForPeriod(period));
  const grandTotal = clients.reduce((s, c) => s + c.revenue, 0);
  const exportQuery = period.kind === "week" ? `week=${period.label}` : `month=${period.label}`;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Client billing</h1>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">Period: {period.label}</span>
        <Link href={`/manager/reports/billing?month=${monthPeriod(cy, cm).label}`} className="text-blue-700 underline">
          This month
        </Link>
        <Link href={`/manager/reports/billing?week=${weekPeriod(now).label}`} className="text-blue-700 underline">
          This week
        </Link>
        <a
          href={`/manager/reports/billing/export?${exportQuery}`}
          className="ml-auto rounded border border-gray-300 px-3 py-1"
        >
          Export CSV
        </a>
      </div>

      {clients.length === 0 ? (
        <p className="text-gray-500">No billable approved time in this period.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {clients.map((c) => (
            <div key={c.clientId} className="rounded border border-gray-200 p-4">
              <div className="flex items-center justify-between font-medium">
                <span>{c.clientName}</span>
                <span>{formatVnd(c.revenue)}</span>
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
                {c.projects.map((p) => (
                  <li key={p.projectId} className="flex items-center justify-between">
                    <span>
                      {p.projectName} · {p.hours} h
                    </span>
                    <span>{formatVnd(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-gray-300 pt-2 font-medium">
            <span>Grand total</span>
            <span>{formatVnd(grandTotal)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
