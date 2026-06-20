// Reporting periods. Asia/Saigon is UTC+7 with no DST, so calendar dates map cleanly
// to UTC-midnight Date values (matching how Prisma @db.Date round-trips).
// Boundaries are [start, end) — start inclusive, end exclusive.

export type PeriodKind = "month" | "week";

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

/** All calendar days in a period. */
export function listDays(period: Period): Date[] {
  const days: Date[] = [];
  for (let t = period.start.getTime(); t < period.end.getTime(); t += 86400000) {
    days.push(new Date(t));
  }
  return days;
}
