"use client";

import { DataTable } from "@/components/data-table/data-table";
import { fixedCostColumns } from "./fixed-costs-columns";
import { AddFixedCostDialog } from "./add-fixed-cost-dialog";

export type FixedCostRow = {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export function FixedCostsTable({ data }: { data: FixedCostRow[] }) {
  return (
    <DataTable
      columns={fixedCostColumns}
      data={data}
      searchKey="name"
      searchPlaceholder="Tìm theo tên…"
      toolbar={<AddFixedCostDialog />}
    />
  );
}
