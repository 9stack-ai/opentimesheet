import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { atLeastManager } from "@/lib/roles";
import { profitabilityForPeriod } from "@/lib/profitability-db";
import { resolvePeriodFromQuery } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !atLeastManager(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const period = resolvePeriodFromQuery(req.nextUrl.searchParams, nowSaigon());

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
