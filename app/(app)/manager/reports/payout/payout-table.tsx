"use client";

import { DataTable } from "@/components/data-table/data-table";
import { buildPayoutColumns } from "./payout-columns";

export type PayoutRow = {
  userId: string;
  userName: string;
  totalHours: number;
  gross: number;
  taxWithheld: number;
  net: number;
  employerCost: number;
  totalCompanyCost: number;
};

export function PayoutTable({ data, periodQuery }: { data: PayoutRow[]; periodQuery: string }) {
  return (
    <DataTable
      columns={buildPayoutColumns(periodQuery)}
      data={data}
      searchKey="userName"
      searchPlaceholder="Tìm theo tên CTV…"
    />
  );
}
