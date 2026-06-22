export type UserRow = {
  id: string;
  name: string;
  email: string; // login identifier (username)
  contactEmail: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
  defaultCostRate: number;
  defaultBillableRate: number;
  taxWithholdingRateBps: number;
  employerCostRateBps: number;
  fixedMonthlySalary: number;
  compensations: CompRow[];
};

export type CompRow = {
  id: string;
  kind: string; // HOURLY | FIXED
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo: string | null;
  costRate: number;
  billableRate: number;
  fixedMonthlySalary: number;
  taxWithholdingRateBps: number;
  employerCostRateBps: number;
};
