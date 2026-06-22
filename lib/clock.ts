// "Now" helpers, wrapped in a plain module so server components can read the
// current time without tripping the react-hooks/purity lint (which flags direct
// Date.now()/new Date() calls inside a component render).

/** Current instant shifted to Asia/Saigon (UTC+7, no DST) for calendar-date math. */
export function nowSaigon(): Date {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

/** Current instant (true UTC) — for elapsed-time math (e.g. work-session duration). */
export function now(): Date {
  return new Date();
}
