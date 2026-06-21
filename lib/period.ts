// Reporting periods. Asia/Saigon is UTC+7 with no DST, so calendar dates map cleanly
// to UTC-midnight Date values (matching how Prisma @db.Date round-trips).
// Boundaries are [start, end) — start inclusive, end exclusive.

export type PeriodKind = "week" | "month" | "quarter" | "half" | "year";

export type Period = {
  kind: PeriodKind;
  start: Date;
  end: Date;
  label: string;
};

function utcMidnight(year: number, month0: number, day: number): Date {
  return new Date(Date.UTC(year, month0, day));
}

/** Strip any time component to UTC midnight (calendar date). */
export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Format a UTC-midnight date as "YYYY-MM-DD". */
export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthPeriod(year: number, month1: number): Period {
  return {
    kind: "month",
    start: utcMidnight(year, month1 - 1, 1),
    end: utcMidnight(year, month1, 1),
    label: `${year}-${String(month1).padStart(2, "0")}`,
  };
}

export function monthPeriodOf(date: Date): Period {
  return monthPeriod(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

/** Calendar quarter (1–4): Q1 = Jan–Mar … Q4 = Oct–Dec. */
export function quarterPeriod(year: number, quarter: number): Period {
  const startMonth0 = (quarter - 1) * 3;
  return {
    kind: "quarter",
    start: utcMidnight(year, startMonth0, 1),
    end: utcMidnight(year, startMonth0 + 3, 1),
    label: `${year}-Q${quarter}`,
  };
}

export function quarterPeriodOf(date: Date): Period {
  return quarterPeriod(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) + 1);
}

/** Calendar half-year (1 = Jan–Jun, 2 = Jul–Dec). */
export function halfPeriod(year: number, half: number): Period {
  const startMonth0 = (half - 1) * 6;
  return {
    kind: "half",
    start: utcMidnight(year, startMonth0, 1),
    end: utcMidnight(year, startMonth0 + 6, 1),
    label: `${year}-H${half}`,
  };
}

export function halfPeriodOf(date: Date): Period {
  return halfPeriod(date.getUTCFullYear(), date.getUTCMonth() < 6 ? 1 : 2);
}

/** Calendar year (Jan–Dec). */
export function yearPeriod(year: number): Period {
  return {
    kind: "year",
    start: utcMidnight(year, 0, 1),
    end: utcMidnight(year + 1, 0, 1),
    label: `${year}`,
  };
}

export function yearPeriodOf(date: Date): Period {
  return yearPeriod(date.getUTCFullYear());
}

/** ISO week number (and ISO year) for a calendar date. */
export function isoWeekNumber(date: Date): { year: number; week: number } {
  const d = toDateOnly(date);
  const dayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the Thursday of this week
  const year = d.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return { year, week };
}

/** ISO week (Monday start) containing `date`. */
export function weekPeriod(date: Date): Period {
  const d = toDateOnly(date);
  const isoDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (isoDow - 1));
  const end = new Date(monday);
  end.setUTCDate(monday.getUTCDate() + 7);
  const { year, week } = isoWeekNumber(date);
  return { kind: "week", start: monday, end, label: `${year}-W${String(week).padStart(2, "0")}` };
}

/** Monday of a given ISO year/week. */
export function isoWeekToMonday(isoYear: number, isoWeek: number): Date {
  const jan4 = utcMidnight(isoYear, 0, 4); // Jan 4 is always in ISO week 1
  const jan4Dow = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  return monday;
}

/** Parse "YYYY-MM" → month period, or null. */
export function monthPeriodFromString(value: string): Period | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return monthPeriod(year, month);
}

/** Parse "YYYY-Www" → week period, or null. */
export function weekPeriodFromString(value: string): Period | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  return weekPeriod(isoWeekToMonday(year, week));
}

/** Parse "YYYY-Qn" → quarter period, or null. */
export function quarterPeriodFromString(value: string): Period | null {
  const m = /^(\d{4})-Q([1-4])$/.exec(value);
  if (!m) return null;
  return quarterPeriod(Number(m[1]), Number(m[2]));
}

/** Parse "YYYY-Hn" → half-year period, or null. */
export function halfPeriodFromString(value: string): Period | null {
  const m = /^(\d{4})-H([1-2])$/.exec(value);
  if (!m) return null;
  return halfPeriod(Number(m[1]), Number(m[2]));
}

/** Parse "YYYY" → year period, or null. */
export function yearPeriodFromString(value: string): Period | null {
  const m = /^(\d{4})$/.exec(value);
  if (!m) return null;
  return yearPeriod(Number(m[1]));
}

export type PeriodSearchParams = {
  week?: string;
  month?: string;
  quarter?: string;
  half?: string;
  year?: string;
};

/** Resolve a report period from URL params (priority week→month→quarter→half→year); else current month. */
export function resolvePeriod(sp: PeriodSearchParams, now: Date): Period {
  if (sp.week) return weekPeriodFromString(sp.week) ?? weekPeriod(now);
  if (sp.month) return monthPeriodFromString(sp.month) ?? monthPeriodOf(now);
  if (sp.quarter) return quarterPeriodFromString(sp.quarter) ?? quarterPeriodOf(now);
  if (sp.half) return halfPeriodFromString(sp.half) ?? halfPeriodOf(now);
  if (sp.year) return yearPeriodFromString(sp.year) ?? yearPeriodOf(now);
  return monthPeriodOf(now);
}

/** Resolve a report period straight from a URLSearchParams (for export routes). */
export function resolvePeriodFromQuery(params: URLSearchParams, now: Date): Period {
  return resolvePeriod(
    {
      week: params.get("week") ?? undefined,
      month: params.get("month") ?? undefined,
      quarter: params.get("quarter") ?? undefined,
      half: params.get("half") ?? undefined,
      year: params.get("year") ?? undefined,
    },
    now,
  );
}

/** The URL query key+value that reproduces this period (key === kind). */
export function periodParam(period: Period): { key: PeriodKind; value: string } {
  return { key: period.kind, value: period.label };
}

/** Adjacent period of the same kind (delta = -1 previous, +1 next). */
export function shiftPeriod(period: Period, delta: number): Period {
  const s = period.start;
  const y = s.getUTCFullYear();
  switch (period.kind) {
    case "week":
      return weekPeriod(new Date(s.getTime() + delta * 7 * 86400000));
    case "month":
      return monthPeriodOf(new Date(Date.UTC(y, s.getUTCMonth() + delta, 1)));
    case "quarter":
      return quarterPeriodOf(new Date(Date.UTC(y, s.getUTCMonth() + delta * 3, 1)));
    case "half":
      return halfPeriodOf(new Date(Date.UTC(y, s.getUTCMonth() + delta * 6, 1)));
    case "year":
      return yearPeriod(y + delta);
  }
}

/** All calendar days in a period. */
export function listDays(period: Period): Date[] {
  const days: Date[] = [];
  for (let t = period.start.getTime(); t < period.end.getTime(); t += 86400000) {
    days.push(new Date(t));
  }
  return days;
}
