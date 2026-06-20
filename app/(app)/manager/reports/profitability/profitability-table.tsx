"use client";

import { DataTable } from "@/components/data-table/data-table";
import { buildProfitabilityColumns } from "./profitability-columns";

export type ProfitabilityRow = {
  projectId: string;
  projectName: string;
  approvedHours: number;
  revenue: number;
  directCost: number;
  allocatedFixed: number;
  net: number;
};

export function ProfitabilityTable({
  data,
  isMonthly,
}: {
  data: ProfitabilityRow[];
  isMonthly: boolean;
}) {
  const columns = buildProfitabilityColumns(isMonthly);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="projectName"
      searchPlaceholder="Tìm theo dự án…"
    />
  );
}
