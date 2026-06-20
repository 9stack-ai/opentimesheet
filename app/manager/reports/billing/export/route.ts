import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { atLeastManager } from "@/lib/roles";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { billingByClient } from "@/lib/reporting";
import { monthPeriod, monthPeriodFromString, weekPeriodFromString, type Period } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !atLeastManager(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const now = nowSaigon();
  const fallback = monthPeriod(now.getUTCFullYear(), now.getUTCMonth() + 1);
  const week = req.nextUrl.searchParams.get("week");
  const month = req.nextUrl.searchParams.get("month");

  let period: Period;
  if (week) period = weekPeriodFromString(week) ?? fallback;
  else if (month) period = monthPeriodFromString(month) ?? fallback;
  else period = fallback;

  const clients = billingByClient(await approvedEntriesForPeriod(period));
  const rows: (string | number)[][] = [];
  for (const c of clients) {
    for (const p of c.projects) {
      rows.push([c.clientName, p.projectName, p.hours, p.revenue]);
    }
  }

  const csv = toCsv(["Client", "Project", "Hours", "Revenue (VND)"], rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="billing-${period.label}.csv"`,
    },
  });
}
