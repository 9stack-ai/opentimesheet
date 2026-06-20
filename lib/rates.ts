// Pure rate resolution — no DB import, so it is unit-testable in isolation.
// Per-project override wins over the user's default rate. Rates are integer VND/hour.

export type RateOverrides = {
  costRateOverride: number | null;
  billableRateOverride: number | null;
};

export type DefaultRates = {
  defaultCostRate: number;
  defaultBillableRate: number;
};

export type EffectiveRates = {
  costRate: number;
  billableRate: number;
};

/** Override (if set) wins over the user default. Used at approval time for snapshotting. */
export function effectiveRates(
  overrides: RateOverrides | null | undefined,
  defaults: DefaultRates,
): EffectiveRates {
  return {
    costRate: overrides?.costRateOverride ?? defaults.defaultCostRate,
    billableRate: overrides?.billableRateOverride ?? defaults.defaultBillableRate,
  };
}
