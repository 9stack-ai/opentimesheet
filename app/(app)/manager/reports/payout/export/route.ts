import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { atLeastManager } from "@/lib/roles";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";
import { resolvePeriodFromQuery } from "@/lib/period";
import { nowSaigon } from "@/lib/clock";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !atLeastManager(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const period = resolvePeriodFromQuery(req.nextUrl.searchParams, nowSaigon());

  const rows = payoutByUser(await approvedEntriesForPeriod(period));
  const csv = toCsv(
    [
      "Freelancer",
      "Hours",
      "Gross (VND)",
      "Tax withheld (VND)",
      "Net (VND)",
      "Employer cost (VND)",
      "Total company cost (VND)",
    ],
    rows.map((r) => [
      r.userName,
      r.totalHours,
      r.gross,
      r.taxWithheld,
      r.net,
      r.employerCost,
      r.totalCompanyCost,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payout-${period.label}.csv"`,
    },
  });
}
