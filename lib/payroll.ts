// Pure payroll/tax helpers — integer VND, no DB import, so unit-testable in isolation.
// Rates are stored as BASIS POINTS (bps): 10% = 1000, 21.5% = 2150.
//
// Two distinct concepts:
//  - Withholding (PIT): DEDUCTED from the collaborator's gross pay. Does NOT change company cost
//    (gross = company cost = net + tax). Splits gross into thực nhận (net) + thuế giữ lại (tax).
//  - Employer insurance: an ADDITIONAL company cost on top of gross (only for full-time employees).

/** PIT withheld from gross pay (thuế giữ lại). */
export function withheldTax(grossDong: number, rateBps: number): number {
  return Math.round((grossDong * rateBps) / 10000);
}

/** Net actually paid to the person (thực nhận) = gross − withheld, so net + tax == gross exactly. */
export function netPay(grossDong: number, rateBps: number): number {
  return grossDong - withheldTax(grossDong, rateBps);
}

/** Employer-side insurance — an ADDITIONAL company cost on top of gross (BH công ty đóng). */
export function employerCost(grossDong: number, rateBps: number): number {
  return Math.round((grossDong * rateBps) / 10000);
}

/** Stored basis points → human percent (1000 → 10, 2150 → 21.5). */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/** Human percent → stored basis points, rounded (10 → 1000, 21.5 → 2150). */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}
