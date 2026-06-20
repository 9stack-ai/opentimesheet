"use client";

import { DataTable } from "@/components/data-table/data-table";
import { billingColumns } from "./billing-columns";

export type BillingRow = {
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  hours: number;
  revenue: number;
};

export function BillingTable({ data }: { data: BillingRow[] }) {
  return (
    <DataTable
      columns={billingColumns}
      data={data}
      searchKey="clientName"
      searchPlaceholder="Tìm theo khách hàng…"
    />
  );
}
