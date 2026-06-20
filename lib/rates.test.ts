import { describe, it, expect } from "vitest";
import { effectiveRates } from "@/lib/rates";

const defaults = { defaultCostRate: 150000, defaultBillableRate: 300000 };

describe("effectiveRates", () => {
  it("uses the user default when there is no assignment override", () => {
    expect(effectiveRates(null, defaults)).toEqual({ costRate: 150000, billableRate: 300000 });
  });

  it("uses the user default when overrides are null", () => {
    expect(
      effectiveRates({ costRateOverride: null, billableRateOverride: null }, defaults),
    ).toEqual({ costRate: 150000, billableRate: 300000 });
  });

  it("override wins over default (both)", () => {
    expect(
      effectiveRates({ costRateOverride: 200000, billableRateOverride: 400000 }, defaults),
    ).toEqual({ costRate: 200000, billableRate: 400000 });
  });

  it("override wins per-field (cost only)", () => {
    expect(
      effectiveRates({ costRateOverride: 180000, billableRateOverride: null }, defaults),
    ).toEqual({ costRate: 180000, billableRate: 300000 });
  });

  it("treats 0 override as a real value (not falsy fallback)", () => {
    expect(
      effectiveRates({ costRateOverride: 0, billableRateOverride: 0 }, defaults),
    ).toEqual({ costRate: 0, billableRate: 0 });
  });
});
