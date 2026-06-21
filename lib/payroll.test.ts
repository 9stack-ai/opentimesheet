import { describe, it, expect } from "vitest";
import { withheldTax, netPay, employerCost, bpsToPercent, percentToBps } from "./payroll";

describe("withheldTax / netPay", () => {
  it("collaborator example: gross 220k @ 10% → tax 22k, net 198k", () => {
    expect(withheldTax(220_000, 1000)).toBe(22_000);
    expect(netPay(220_000, 1000)).toBe(198_000);
  });

  it("0 bps → no withholding (legacy/unset rows treated as 0)", () => {
    expect(withheldTax(220_000, 0)).toBe(0);
    expect(netPay(220_000, 0)).toBe(220_000);
  });

  it("net + tax == gross for assorted values (reconciliation)", () => {
    for (const [gross, bps] of [
      [195, 1000],
      [1_234_567, 1000],
      [999, 2150],
      [50_000_000, 1050],
    ] as const) {
      expect(netPay(gross, bps) + withheldTax(gross, bps)).toBe(gross);
    }
  });

  it("rounds the tax to whole dong", () => {
    // 195 * 10% = 19.5 → 20 (round), net 175
    expect(withheldTax(195, 1000)).toBe(20);
    expect(netPay(195, 1000)).toBe(175);
  });
});

describe("employerCost", () => {
  it("employer insurance 21.5% on 30M salary → 6,450,000", () => {
    expect(employerCost(30_000_000, 2150)).toBe(6_450_000);
  });

  it("0 bps → no employer cost", () => {
    expect(employerCost(30_000_000, 0)).toBe(0);
  });
});

describe("bps <-> percent", () => {
  it("bpsToPercent", () => {
    expect(bpsToPercent(1000)).toBe(10);
    expect(bpsToPercent(2150)).toBe(21.5);
    expect(bpsToPercent(0)).toBe(0);
  });

  it("percentToBps rounds to integer bps", () => {
    expect(percentToBps(10)).toBe(1000);
    expect(percentToBps(21.5)).toBe(2150);
    expect(percentToBps(0)).toBe(0);
  });

  it("round-trips a clean percent", () => {
    expect(bpsToPercent(percentToBps(21.5))).toBe(21.5);
  });
});
