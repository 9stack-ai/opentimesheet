// VND money helpers.
// Invariant: money is stored and computed as INTEGER dong (no fractional units).
// Hours are Decimal(5,2); money is always integer VND. Round only at display/total level.

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** Format an integer dong amount as VND, e.g. 1234567 -> "1.234.567 ₫". */
export function formatVnd(amountDong: number): string {
  if (!Number.isFinite(amountDong)) {
    throw new Error(`formatVnd: not a finite number: ${amountDong}`);
  }
  return VND.format(Math.trunc(amountDong));
}

/** Parse a user-entered VND string into integer dong. Strips grouping, symbols, spaces. */
export function parseVnd(input: string): number {
  const negative = input.trim().startsWith("-");
  const digits = input.replace(/[^\d]/g, "");
  if (digits === "") return 0;
  const value = Number.parseInt(digits, 10);
  return negative ? -value : value;
}

/** Assert a value is integer dong; returns it. Use at money boundaries to catch float drift. */
export function toVndInt(value: number): number {
  if (!Number.isInteger(value)) {
    throw new Error(`VND amounts must be integer dong, got: ${value}`);
  }
  return value;
}
