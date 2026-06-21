"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { buildFixedCostColumns } from "./fixed-costs-columns";
import { AddFixedCostDialog } from "./add-fixed-cost-dialog";

export type FixedCostRow = {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
};

export function FixedCostsTable({ data, categories }: { data: FixedCostRow[]; categories: string[] }) {
  const columns = React.useMemo(() => buildFixedCostColumns(categories), [categories]);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Tìm theo tên…"
      toolbar={<AddFixedCostDialog categories={categories} />}
    />
  );
}
