export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  defaultCostRate: number;
  defaultBillableRate: number;
  taxWithholdingRateBps: number;
  employerCostRateBps: number;
};
