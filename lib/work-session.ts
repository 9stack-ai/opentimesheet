// Pure work-session helpers — no DB import, so unit-testable in isolation.
// A live work session records elapsed time; the recorded hours are capped at 4h and
// rounded to 2 decimals (0.01h). All time math is on epoch milliseconds (UTC), so the
// recorded hours never depend on the client's clock.

/** Maximum recordable length of a single session (4 hours). */
export const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

/** Minimum length before a session can be recorded (1 minute). Shorter ends are blocked. */
export const MIN_SESSION_MS = 60 * 1000;

/**
 * Hours worked in a session = (end − start), capped at 4h, rounded to 2 decimals.
 * `capped` is true when the raw elapsed exceeded 4h (so the UI can warn).
 */
export function sessionHours(startedAt: Date, endedAt: Date): { hours: number; capped: boolean } {
  const rawMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const capped = rawMs > MAX_SESSION_MS;
  const ms = Math.min(rawMs, MAX_SESSION_MS);
  const hours = Math.round((ms / 3_600_000) * 100) / 100; // 2 decimals
  return { hours, capped };
}
