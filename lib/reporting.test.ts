import { describe, it, expect } from "vitest";
import {
  payoutByUser,
  billingByClient,
  fixedCostActiveInPeriod,
  totalFixedCostsForPeriod,
  type ApprovedEntry,
} from "@/lib/reporting";
import { monthPeriod } from "@/lib/period";

function entry(p: Partial<ApprovedEntry>): ApprovedEntry {
  return {
    userId: "u1",
    userName: "A",
    hours: 1,
    costRateSnapshot: 100000,
    billableRateSnapshot: 200000,
    projectId: "p1",
    projectName: "P",
    clientId: "c1",
    clientName: "C",
    ...p,
  };
}

describe("payoutByUser", () => {
  it("sums hours*costRateSnapshot per user", () => {
    const rows = payoutByUser([
      entry({ userId: "u1", userName: "Alice", hours: 2, costRateSnapshot: 150000 }),
      entry({ userId: "u1", userName: "Alice", hours: 1.5, costRateSnapshot: 150000 }),
      entry({ userId: "u2", userName: "Bob", hours: 3, costRateSnapshot: 120000 }),
    ]);
    expect(rows).toEqual([
      { userId: "u1", userName: "Alice", totalHours: 3.5, payout: 525000 },
      { userId: "u2", userName: "Bob", totalHours: 3, payout: 360000 },
    ]);
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
