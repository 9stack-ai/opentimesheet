import { describe, it, expect } from "vitest";
import { computeProfitability, type ProfitabilityInput } from "@/lib/profitability";

const base: ProfitabilityInput = {
  projects: [
    { projectId: "p1", projectName: "P1", approvedHours: 10, revenue: 3000000, directCost: 1500000 },
    { projectId: "p2", projectName: "P2", approvedHours: 30, revenue: 9000000, directCost: 3600000 },
  ],
  totalFixed: 20000000,
  companyExpenses: 1000000,
};

describe("computeProfitability — monthly", () => {
  it("1. allocates fixed costs by hours (exact)", () => {
    const r = computeProfitability(base);
    const p1 = r.perProject.find((p) => p.projectId === "p1")!;
    const p2 = r.perProject.find((p) => p.projectId === "p2")!;
    expect(p1.allocatedFixed).toBe(5000000); // 10/40 × 20M
    expect(p2.allocatedFixed).toBe(15000000); // 30/40 × 20M
    expect(p1.net).toBe(3000000 - 1500000 - 5000000);
    expect(p2.net).toBe(9000000 - 3600000 - 15000000);
    expect(r.company.net).toBe(12000000 - 5100000 - 20000000 - 1000000);
  });

  it("2. zero company hours → no allocation, no NaN, fixed stays company overhead", () => {
    const r = computeProfitability({
      projects: [{ projectId: "p1", projectName: "P1", approvedHours: 0, revenue: 0, directCost: 0 }],
      totalFixed: 20000000,
      companyExpenses: 0,
    });
    expect(r.perProject[0].allocatedFixed).toBe(0);
    expect(Number.isFinite(r.company.net)).toBe(true);
    expect(r.company.net).toBe(-20000000);
  });

  it("3. a project with 0 hours gets 0 allocation", () => {
    const r = computeProfitability({
      projects: [
        { projectId: "p1", projectName: "P1", approvedHours: 0, revenue: 0, directCost: 0 },
        { projectId: "p2", projectName: "P2", approvedHours: 10, revenue: 1000000, directCost: 0 },
      ],
      totalFixed: 7000000,
      companyExpenses: 0,
    });
    expect(r.perProject.find((p) => p.projectId === "p1")!.allocatedFixed).toBe(0);
    expect(r.perProject.find((p) => p.projectId === "p2")!.allocatedFixed).toBe(7000000);
  });

  it("5. largest-remainder rounding → Σ allocated == totalFixed exactly", () => {
    const r = computeProfitability({
      projects: [
        { projectId: "a", projectName: "A", approvedHours: 1, revenue: 0, directCost: 0 },
        { projectId: "b", projectName: "B", approvedHours: 1, revenue: 0, directCost: 0 },
        { projectId: "c", projectName: "C", approvedHours: 1, revenue: 0, directCost: 0 },
      ],
      totalFixed: 100,
      companyExpenses: 0,
    });
    expect(r.perProject.reduce((s, p) => s + p.allocatedFixed, 0)).toBe(100);
    expect(r.perProject.map((p) => p.allocatedFixed).sort((x, y) => x - y)).toEqual([33, 33, 34]);
  });

  it("6. company expenses affect company.net only, not project nets", () => {
    const r = computeProfitability({
      projects: [{ projectId: "p1", projectName: "P1", approvedHours: 10, revenue: 1000000, directCost: 0 }],
      totalFixed: 0,
      companyExpenses: 500000,
    });
    expect(r.perProject[0].net).toBe(1000000);
    expect(r.company.net).toBe(1000000 - 500000);
  });

  it("7. reconciliation identity holds", () => {
    const r = computeProfitability(base);
    const sumNet = r.perProject.reduce((s, p) => s + p.net, 0);
    const sumAlloc = r.perProject.reduce((s, p) => s + p.allocatedFixed, 0);
    expect(r.company.net).toBe(sumNet - (r.company.totalFixed - sumAlloc) - r.company.companyExpenses);
  });
});

describe("computeProfitability — weekly (gross margin)", () => {
  it("8. no fixed allocation; net = revenue − directCost", () => {
    const r = computeProfitability(base, false);
    for (const p of r.perProject) {
      expect(p.allocatedFixed).toBe(0);
      expect(p.net).toBe(p.revenue - p.directCost);
    }
    expect(r.company.totalFixed).toBe(0);
    expect(r.company.net).toBe(12000000 - 5100000 - 0 - 1000000);
  });
});

// Note: case 4 ("rejected/draft excluded") is enforced upstream by the
// `status: APPROVED` filter in approvedEntriesForPeriod, not by the pure engine.
