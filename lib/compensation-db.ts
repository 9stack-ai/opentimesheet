import { prisma } from "@/lib/db";
import { compAt } from "@/lib/compensation";

/** Keep the user's CURRENT (open-ended) compensation period in sync with their default rate/salary
 *  fields — so the existing "create/edit user" forms manage the present period. Dated history is
 *  added separately. Creates the open period if none exists (effectiveFrom floored well in the past). */
export async function syncCurrentCompensation(
  userId: string,
  c: {
    defaultCostRate: number;
    defaultBillableRate: number;
    fixedMonthlySalary: number;
    taxWithholdingRateBps: number;
    employerCostRateBps: number;
  },
): Promise<void> {
  const data = {
    kind: c.fixedMonthlySalary > 0 ? "FIXED" : "HOURLY",
    costRate: c.defaultCostRate,
    billableRate: c.defaultBillableRate,
    fixedMonthlySalary: c.fixedMonthlySalary,
    taxWithholdingRateBps: c.taxWithholdingRateBps,
    employerCostRateBps: c.employerCostRateBps,
  };
  const open = await prisma.compensation.findFirst({
    where: { userId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
    select: { id: true },
  });
  if (open) await prisma.compensation.update({ where: { id: open.id }, data });
  else await prisma.compensation.create({ data: { userId, effectiveFrom: new Date("2020-01-01"), ...data } });
}

export type SnapshotRates = {
  costRateSnapshot: number;
  billableRateSnapshot: number;
  taxRateSnapshot: number;
  employerCostRateSnapshot: number;
};

/**
 * Rates to freeze onto a time entry, resolved for the entry's DATE: the HOURLY Compensation period
 * covering that date (fallback to the user's current default fields if none), with the per-project
 * assignment override winning on cost/billable rate. Used at approval and on admin edits of approved
 * entries so a rate change only affects entries dated after it.
 */
export async function snapshotRatesForEntry(
  userId: string,
  projectId: string,
  date: Date,
): Promise<SnapshotRates> {
  const [user, comps, assignment] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        defaultCostRate: true,
        defaultBillableRate: true,
        taxWithholdingRateBps: true,
        employerCostRateBps: true,
      },
    }),
    prisma.compensation.findMany({
      where: { userId, kind: "HOURLY" },
      select: {
        effectiveFrom: true,
        effectiveTo: true,
        costRate: true,
        billableRate: true,
        taxWithholdingRateBps: true,
        employerCostRateBps: true,
      },
    }),
    prisma.assignment.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { costRateOverride: true, billableRateOverride: true },
    }),
  ]);

  const comp = compAt(comps, date);
  const baseCost = comp?.costRate ?? user.defaultCostRate;
  const baseBill = comp?.billableRate ?? user.defaultBillableRate;
  return {
    costRateSnapshot: assignment?.costRateOverride ?? baseCost,
    billableRateSnapshot: assignment?.billableRateOverride ?? baseBill,
    taxRateSnapshot: comp?.taxWithholdingRateBps ?? user.taxWithholdingRateBps,
    employerCostRateSnapshot: comp?.employerCostRateBps ?? user.employerCostRateBps,
  };
}
