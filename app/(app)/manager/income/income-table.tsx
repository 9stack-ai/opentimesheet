"use client";

import { DataTable } from "@/components/data-table/data-table";
import { incomeColumns } from "./income-columns";
import { AddIncomeDialog } from "./add-income-dialog";

export type IncomeRow = {
  id: string;
  date: string | null;
  source: string;
  amount: number;
  note: string | null;
};

export function IncomeTable({ data }: { data: IncomeRow[] }) {
  return (
    <DataTable
      columns={incomeColumns}
      data={data}
      searchKey="source"
      searchPlaceholder="Tìm theo nguồn thu…"
      toolbar={<AddIncomeDialog />}
    />
  );
}
