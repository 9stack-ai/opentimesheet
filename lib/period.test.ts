import { describe, it, expect } from "vitest";
import {
  monthPeriod,
  weekPeriod,
  isoWeekNumber,
  isoWeekToMonday,
  monthPeriodFromString,
  weekPeriodFromString,
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
});
