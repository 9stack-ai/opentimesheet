export type UserRow = {
  id: string;
  name: string;
  email: string; // login identifier (username)
  contactEmail: string | null;
  role: string;
  status: string;
  defaultCostRate: number;
  defaultBillableRate: number;
  taxWithholdingRateBps: number;
  employerCostRateBps: number;
};
