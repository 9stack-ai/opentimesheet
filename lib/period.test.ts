import { describe, it, expect } from "vitest";
import {
  monthPeriod,
  weekPeriod,
  isoWeekNumber,
  isoWeekToMonday,
  monthPeriodFromString,
  weekPeriodFromString,
  quarterPeriod,
  halfPeriod,
  yearPeriod,
  quarterPeriodFromString,
  halfPeriodFromString,
  yearPeriodFromString,
  resolvePeriod,
  shiftPeriod,
  periodParam,
  formatISODate,
  listDays,
} from "@/lib/period";

describe("monthPeriod", () => {
  it("spans first-of-month to first-of-next-month (exclusive)", () => {
    const p = monthPeriod(2026, 6);
    expect(formatISODate(p.start)).toBe("2026-06-01");
    expect(formatISODate(p.end)).toBe("2026-07-01");
    expect(p.label).toBe("2026-06");
  });

  it("handles December → next year", () => {
    const p = monthPeriod(2026, 12);
    expect(formatISODate(p.start)).toBe("2026-12-01");
    expect(formatISODate(p.end)).toBe("2027-01-01");
  });

  it("listDays returns the right count", () => {
    expect(listDays(monthPeriod(2026, 2))).toHaveLength(28); // 2026 not leap
  });
});

describe("weekPeriod (ISO, Monday start)", () => {
  it("snaps any weekday to its Monday..next-Monday", () => {
    const wed = weekPeriod(new Date(Date.UTC(2026, 5, 17))); // Wed 2026-06-17
    expect(formatISODate(wed.start)).toBe("2026-06-15"); // Monday
    expect(formatISODate(wed.end)).toBe("2026-06-22"); // next Monday
    expect(wed.label).toBe("2026-W25");
  });

  it("label is stable across the whole week", () => {
    const labels = [15, 16, 17, 18, 19, 20, 21].map(
      (d) => weekPeriod(new Date(Date.UTC(2026, 5, d))).label,
    );
    expect(new Set(labels).size).toBe(1);
    expect(labels[0]).toBe("2026-W25");
  });

  it("isoWeekNumber matches and round-trips via isoWeekToMonday", () => {
    const { year, week } = isoWeekNumber(new Date(Date.UTC(2026, 5, 17)));
    expect({ year, week }).toEqual({ year: 2026, week: 25 });
    expect(formatISODate(isoWeekToMonday(2026, 25))).toBe("2026-06-15");
  });
});

describe("period parsing", () => {
  it("monthPeriodFromString round-trips", () => {
    expect(monthPeriodFromString("2026-06")?.label).toBe("2026-06");
    expect(monthPeriodFromString("2026-13")).toBeNull();
    expect(monthPeriodFromString("bad")).toBeNull();
  });

  it("weekPeriodFromString round-trips", () => {
    const p = weekPeriodFromString("2026-W25");
    expect(formatISODate(p!.start)).toBe("2026-06-15");
    expect(weekPeriodFromString("2026-W99")).toBeNull();
  });

  it("quarter/half/year parse + round-trip", () => {
    expect(quarterPeriodFromString("2026-Q2")?.label).toBe("2026-Q2");
    expect(quarterPeriodFromString("2026-Q5")).toBeNull();
    expect(halfPeriodFromString("2026-H1")?.label).toBe("2026-H1");
    expect(halfPeriodFromString("2026-H3")).toBeNull();
    expect(yearPeriodFromString("2026")?.label).toBe("2026");
    expect(yearPeriodFromString("bad")).toBeNull();
  });
});

describe("calendar quarter/half/year spans", () => {
  it("quarter 2 = Apr 1 → Jul 1", () => {
    const p = quarterPeriod(2026, 2);
    expect(formatISODate(p.start)).toBe("2026-04-01");
    expect(formatISODate(p.end)).toBe("2026-07-01");
    expect(p.kind).toBe("quarter");
  });

  it("half 1 = Jan 1 → Jul 1, half 2 = Jul 1 → next Jan 1", () => {
    expect(formatISODate(halfPeriod(2026, 1).start)).toBe("2026-01-01");
    expect(formatISODate(halfPeriod(2026, 1).end)).toBe("2026-07-01");
    expect(formatISODate(halfPeriod(2026, 2).end)).toBe("2027-01-01");
  });

  it("year = Jan 1 → next Jan 1", () => {
    const p = yearPeriod(2026);
    expect(formatISODate(p.start)).toBe("2026-01-01");
    expect(formatISODate(p.end)).toBe("2027-01-01");
  });
});

describe("resolvePeriod + shiftPeriod", () => {
  const now = new Date(Date.UTC(2026, 5, 17)); // 2026-06-17

  it("priority week→month→quarter→half→year, else current month", () => {
    expect(resolvePeriod({}, now).label).toBe("2026-06");
    expect(resolvePeriod({ year: "2025" }, now).label).toBe("2025");
    expect(resolvePeriod({ quarter: "2026-Q1" }, now).label).toBe("2026-Q1");
    // week wins over month when both present
    expect(resolvePeriod({ week: "2026-W25", month: "2026-01" }, now).kind).toBe("week");
  });

  it("bad value falls back to the current period of that kind", () => {
    expect(resolvePeriod({ quarter: "bad" }, now).label).toBe("2026-Q2");
  });

  it("shiftPeriod moves within the same kind, with year rollover", () => {
    expect(shiftPeriod(monthPeriod(2026, 1), -1).label).toBe("2025-12");
    expect(shiftPeriod(quarterPeriod(2026, 4), 1).label).toBe("2027-Q1");
    expect(shiftPeriod(yearPeriod(2026), -1).label).toBe("2025");
    expect(periodParam(quarterPeriod(2026, 2))).toEqual({ key: "quarter", value: "2026-Q2" });
  });
});
