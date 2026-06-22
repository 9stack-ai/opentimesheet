import { describe, expect, it } from "vitest";
import { MAX_SESSION_MS, sessionHours } from "./work-session";

const base = new Date("2026-06-22T01:00:00.000Z");
const after = (ms: number) => new Date(base.getTime() + ms);

describe("sessionHours", () => {
  it("rounds to 2 decimals — 2h37m → 2.62h", () => {
    const r = sessionHours(base, after((2 * 60 + 37) * 60 * 1000));
    expect(r).toEqual({ hours: 2.62, capped: false });
  });

  it("exactly 4h → 4.00, not capped", () => {
    expect(sessionHours(base, after(MAX_SESSION_MS))).toEqual({ hours: 4, capped: false });
  });

  it("over 4h → clamps to 4.00 and flags capped", () => {
    expect(sessionHours(base, after(MAX_SESSION_MS + 60 * 60 * 1000))).toEqual({ hours: 4, capped: true });
  });

  it("end before start → 0, not capped", () => {
    expect(sessionHours(base, after(-1000))).toEqual({ hours: 0, capped: false });
  });

  it("sub-18s session rounds to 0.00 (caller must reject)", () => {
    expect(sessionHours(base, after(10_000)).hours).toBe(0);
  });

  it("1 minute → 0.02h", () => {
    expect(sessionHours(base, after(60_000)).hours).toBe(0.02);
  });
});
