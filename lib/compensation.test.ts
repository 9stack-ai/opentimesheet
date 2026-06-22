import { describe, expect, it } from "vitest";
import { compAt, wholeMonthsBetween } from "./compensation";

const d = (s: string) => new Date(s);

describe("compAt", () => {
  const comps = [
    { effectiveFrom: d("2026-01-01"), effectiveTo: d("2026-06-30") },
    { effectiveFrom: d("2026-07-01"), effectiveTo: null },
  ];
  it("picks the period covering the date", () => {
    expect(compAt(comps, d("2026-03-15"))?.effectiveFrom).toEqual(d("2026-01-01"));
    expect(compAt(comps, d("2026-09-15"))?.effectiveFrom).toEqual(d("2026-07-01"));
  });
  it("open-ended period covers far future", () => {
    expect(compAt(comps, d("2030-01-01"))?.effectiveTo).toBeNull();
  });
  it("returns null before any period", () => {
    expect(compAt(comps, d("2025-12-31"))).toBeNull();
  });
  it("newest effectiveFrom wins on overlap", () => {
    const overlap = [
      { effectiveFrom: d("2026-01-01"), effectiveTo: null },
      { effectiveFrom: d("2026-06-01"), effectiveTo: null },
    ];
    expect(compAt(overlap, d("2026-08-01"))?.effectiveFrom).toEqual(d("2026-06-01"));
  });
});

describe("wholeMonthsBetween", () => {
  it("one month", () => expect(wholeMonthsBetween(d("2026-06-01"), d("2026-07-01"))).toBe(1));
  it("quarter = 3", () => expect(wholeMonthsBetween(d("2026-04-01"), d("2026-07-01"))).toBe(3));
  it("year = 12", () => expect(wholeMonthsBetween(d("2026-01-01"), d("2027-01-01"))).toBe(12));
  it("sub-month (week) = 0", () => expect(wholeMonthsBetween(d("2026-06-08"), d("2026-06-15"))).toBe(0));
  it("partial leading month skipped", () =>
    expect(wholeMonthsBetween(d("2026-06-10"), d("2026-08-01"))).toBe(1)); // only July
  it("end ≤ start → 0", () => expect(wholeMonthsBetween(d("2026-07-01"), d("2026-06-01"))).toBe(0));
});
