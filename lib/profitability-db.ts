import type { Period } from "@/lib/period";
import {
  approvedEntriesForPeriod,
  expensesForPeriod,
  fixedCostsTotalForPeriod,
} from "@/lib/reporting-db";
import { computeProfitability, type ProfitabilityInput, type Profitability } from "@/lib/profitability";

/** Fetch + shape period data, then run the pure profitability engine. */
export async function profitabilityForPeriod(period: Period): Promise<Profitability> {
  const [entries, expenses, totalFixed] = await Promise.all([
    approvedEntriesForPeriod(period),
    expensesForPeriod(period),
    period.kind === "month" ? fixedCostsTotalForPeriod(period) : Promise.resolve(0),
  ]);

  const map = new Map<
    string,
    { projectName: string; approvedHours: number; revenueRaw: number; laborRaw: number; employerRaw: number }
  >();
  for (const e of entries) {
    const m =
      map.get(e.projectId) ??
      { projectName: e.projectName, approvedHours: 0, revenueRaw: 0, laborRaw: 0, employerRaw: 0 };
    const entryGross = e.hours * e.costRateSnapshot;
    m.approvedHours += e.hours;
    m.revenueRaw += e.hours * e.billableRateSnapshot;
    m.laborRaw += entryGross;
    // Employer-side insurance is a real additional company cost (withholding is NOT — it's within gross).
    m.employerRaw += (entryGross * e.employerCostRateSnapshot) / 10000;
    map.set(e.projectId, m);
  }

  const projects: ProfitabilityInput["projects"] = Array.from(map.entries()).map(([projectId, m]) => ({
    projectId,
    projectName: m.projectName,
    approvedHours: m.approvedHours,
    revenue: Math.round(m.revenueRaw),
    directCost:
      Math.round(m.laborRaw) + Math.round(m.employerRaw) + (expenses.projectExpenses.get(projectId) ?? 0),
  }));

  const input: ProfitabilityInput = {
    projects,
    totalFixed,
    companyExpenses: expenses.companyTotal,
  };
  return computeProfitability(input, period.kind === "month");
}
