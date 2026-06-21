"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { buildIncomeColumns } from "./income-columns";
import { AddIncomeDialog } from "./add-income-dialog";

export type IncomeRow = {
  id: string;
  date: string | null;
  source: string;
  amount: number;
  note: string | null;
  // gắn dự án (tuỳ chọn) — preserved/editable
  projectId: string | null;
  projectLabel: string | null;
};

type Project = { id: string; clientName: string; name: string };

export function IncomeTable({ data, projects }: { data: IncomeRow[]; projects: Project[] }) {
  const columns = React.useMemo(() => buildIncomeColumns(projects), [projects]);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="source"
      searchPlaceholder="Tìm theo nguồn thu…"
      toolbar={<AddIncomeDialog projects={projects} />}
    />
  );
}
