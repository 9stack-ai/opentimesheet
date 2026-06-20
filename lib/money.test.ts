import { describe, it, expect } from "vitest";
import { formatVnd, parseVnd, toVndInt } from "@/lib/money";

describe("money (VND)", () => {
  it("formats integer dong with Vietnamese grouping", () => {
    expect(formatVnd(1234567)).toMatch(/1\.234\.567/);
    expect(formatVnd(0)).toMatch(/0/);
  });

  it("round-trips format -> parse for non-negative amounts", () => {
    for (const a of [0, 50000, 250000, 1234567, 9999999999]) {
      expect(parseVnd(formatVnd(a))).toBe(a);
    }
  });

  it("parseVnd strips symbols and grouping", () => {
    expect(parseVnd("1.234.567 ₫")).toBe(1234567);
    expect(parseVnd("250000")).toBe(250000);
    expect(parseVnd("")).toBe(0);
    expect(parseVnd("-1.000")).toBe(-1000);
  });

  it("toVndInt rejects non-integers and accepts integers", () => {
    expect(() => toVndInt(1.5)).toThrow();
    expect(toVndInt(1000)).toBe(1000);
  });

  it("formatVnd rejects non-finite input", () => {
    expect(() => formatVnd(Number.NaN)).toThrow();
    expect(() => formatVnd(Number.POSITIVE_INFINITY)).toThrow();
  });
});
