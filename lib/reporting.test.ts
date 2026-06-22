import { describe, it, expect } from "vitest";
import {
  payoutByUser,
  billingByClient,
  fixedCostActiveInPeriod,
  totalFixedCostsForPeriod,
  type ApprovedEntry,
} from "@/lib/reporting";
import { monthPeriod, quarterPeriod, yearPeriod, weekPeriod } from "@/lib/period";

function entry(p: Partial<ApprovedEntry>): ApprovedEntry {
  return {
    userId: "u1",
    userName: "A",
    date: new Date("2026-06-01"),
    hours: 1,
    costRateSnapshot: 100000,
    billableRateSnapshot: 200000,
    taxRateSnapshot: 0,
    employerCostRateSnapshot: 0,
    projectId: "p1",
    projectName: "P",
    clientId: "c1",
    clientName: "C",
    ...p,
  };
}

describe("payoutByUser", () => {
  it("sums gross per user; 0% tax → net == gross, no employer cost", () => {
    const rows = payoutByUser([
      entry({ userId: "u1", userName: "Alice", hours: 2, costRateSnapshot: 150000 }),
      entry({ userId: "u1", userName: "Alice", hours: 1.5, costRateSnapshot: 150000 }),
      entry({ userId: "u2", userName: "Bob", hours: 3, costRateSnapshot: 120000 }),
    ]);
    expect(rows).toEqual([
      { userId: "u1", userName: "Alice", totalHours: 3.5, gross: 525000, taxWithheld: 0, net: 525000, employerCost: 0, totalCompanyCost: 525000 },
      { userId: "u2", userName: "Bob", totalHours: 3, gross: 360000, taxWithheld: 0, net: 360000, employerCost: 0, totalCompanyCost: 360000 },
    ]);
  });

  it("splits gross into tax/net (CTV 10%) and adds employer insurance (NV 21.5%)", () => {
    const rows = payoutByUser([
      entry({ userId: "u1", userName: "CTV", hours: 2, costRateSnapshot: 110000, taxRateSnapshot: 1000 }),
      entry({ userId: "u2", userName: "NV", hours: 10, costRateSnapshot: 100000, employerCostRateSnapshot: 2150 }),
    ]);
    expect(rows).toEqual([
      // gross 220k → tax 22k → net 198k (the collaborator example); no employer cost
      { userId: "u1", userName: "CTV", totalHours: 2, gross: 220000, taxWithheld: 22000, net: 198000, employerCost: 0, totalCompanyCost: 220000 },
      // gross 1M, no withholding, employer insurance 215k → company cost 1,215,000
      { userId: "u2", userName: "NV", totalHours: 10, gross: 1000000, taxWithheld: 0, net: 1000000, employerCost: 215000, totalCompanyCost: 1215000 },
    ]);
    // net + tax always reconciles to gross
    for (const r of rows) expect(r.net + r.taxWithheld).toBe(r.gross);
  });

  it("returns [] for no entries", () => {
    expect(payoutByUser([])).toEqual([]);
  });

  it("sorts by user name", () => {
    const rows = payoutByUser([
      entry({ userId: "u2", userName: "Zed" }),
      entry({ userId: "u1", userName: "Amy" }),
    ]);
    expect(rows.map((r) => r.userName)).toEqual(["Amy", "Zed"]);
  });
});

describe("fixedCostActiveInPeriod", () => {
  const june = monthPeriod(2026, 6); // [2026-06-01, 2026-07-01)
  const fc = (from: string, to: string | null) => ({
    monthlyAmount: 1,
    effectiveFrom: new Date(from),
    effectiveTo: to ? new Date(to) : null,
  });

  it("active when an open-ended range overlaps the month", () => {
    expect(fixedCostActiveInPeriod(fc("2026-01-01", null), june.start, june.end)).toBe(true);
  });
  it("inactive when it ended before the month", () => {
    expect(fixedCostActiveInPeriod(fc("2026-01-01", "2026-05-31"), june.start, june.end)).toBe(false);
  });
  it("inactive when it starts after the month", () => {
    expect(fixedCostActiveInPeriod(fc("2026-07-01", null), june.start, june.end)).toBe(false);
  });
  it("active when it starts on the last day of the month", () => {
    expect(fixedCostActiveInPeriod(fc("2026-06-30", null), june.start, june.end)).toBe(true);
  });
});

describe("totalFixedCostsForPeriod", () => {
  const june = monthPeriod(2026, 6);
  it("sums only active costs", () => {
    const total = totalFixedCostsForPeriod(
      [
        { monthlyAmount: 20000000, effectiveFrom: new Date("2026-01-01"), effectiveTo: null },
        { monthlyAmount: 5000000, effectiveFrom: new Date("2026-07-01"), effectiveTo: null },
      ],
      june.start,
      june.end,
    );
    expect(total).toBe(20000000);
  });

  it("accrues per active month: a quarter ≈ 3×, a year ≈ 12×", () => {
    const cost = [{ monthlyAmount: 10000000, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }];
    const q = quarterPeriod(2026, 2);
    const y = yearPeriod(2026);
    expect(totalFixedCostsForPeriod(cost, q.start, q.end)).toBe(30000000); // Apr+May+Jun
    expect(totalFixedCostsForPeriod(cost, y.start, y.end)).toBe(120000000); // 12 months
  });

  it("only counts months where the cost is active", () => {
    const cost = [
      // active May–Jun only
      { monthlyAmount: 1000000, effectiveFrom: new Date("2026-05-01"), effectiveTo: new Date("2026-06-30") },
    ];
    const q2 = quarterPeriod(2026, 2); // Apr,May,Jun → 2 active months
    expect(totalFixedCostsForPeriod(cost, q2.start, q2.end)).toBe(2000000);
  });

  it("a mid-month week contributes no whole month", () => {
    const cost = [{ monthlyAmount: 9000000, effectiveFrom: new Date("2026-01-01"), effectiveTo: null }];
    const w = weekPeriod(new Date(Date.UTC(2026, 5, 17))); // 2026-06-15..22, inside June
    expect(totalFixedCostsForPeriod(cost, w.start, w.end)).toBe(0);
  });
});

describe("billingByClient", () => {
  it("groups approved revenue by client and project using billableRateSnapshot", () => {
    const rows = billingByClient([
      entry({ clientId: "c1", clientName: "Acme", projectId: "p1", projectName: "Site", hours: 2, billableRateSnapshot: 300000 }),
      entry({ clientId: "c1", clientName: "Acme", projectId: "p2", projectName: "App", hours: 1, billableRateSnapshot: 400000 }),
      entry({ clientId: "c2", clientName: "Beta", projectId: "p3", projectName: "X", hours: 3, billableRateSnapshot: 250000 }),
    ]);
    expect(rows.map((r) => [r.clientName, r.revenue])).toEqual([
      ["Acme", 1000000],
      ["Beta", 750000],
    ]);
    expect(rows[0].projects.map((p) => [p.projectName, p.revenue])).toEqual([
      ["App", 400000],
      ["Site", 600000],
    ]);
  });

  it("returns [] for no entries", () => {
    expect(billingByClient([])).toEqual([]);
  });
});
