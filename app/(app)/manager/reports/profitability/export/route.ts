import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { atLeastManager } from "@/lib/roles";
import { profitabilityForPeriod } from "@/lib/profitability-db";
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

  const { perProject, company } = await profitabilityForPeriod(period);
  const rows: (string | number)[][] = perProject.map((p) => [
    p.projectName,
    p.approvedHours,
    p.revenue,
    p.directCost,
    p.allocatedFixed,
    p.net,
  ]);
  rows.push(["— Company —", "", company.revenue, company.directCost, company.totalFixed, company.net]);

  const csv = toCsv(["Project", "Hours", "Revenue", "Direct cost", "Fixed (alloc)", "Net"], rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="profitability-${period.label}.csv"`,
    },
  });
}
