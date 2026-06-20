"use client";

import { DataTable } from "@/components/data-table/data-table";
import { payoutColumns } from "./payout-columns";

export type PayoutRow = {
  userId: string;
  userName: string;
  totalHours: number;
  payout: number;
};

export function PayoutTable({ data }: { data: PayoutRow[] }) {
  return (
    <DataTable
      columns={payoutColumns}
      data={data}
      searchKey="userName"
      searchPlaceholder="Tìm theo tên CTV…"
    />
  );
}
