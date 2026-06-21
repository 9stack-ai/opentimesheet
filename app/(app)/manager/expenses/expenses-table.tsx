"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { buildExpenseColumns } from "./expenses-columns";
import { AddExpenseDialog } from "./add-expense-dialog";

export type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  projectLabel: string;
  amount: number;
  // carried for the edit dialog (project & kind are now editable)
  projectId: string | null;
  kind: string;
  note: string | null;
};

type Project = { id: string; clientName: string; name: string };

export function ExpensesTable({
  data,
  projects,
  categories,
  today,
  kind = "REGULAR",
}: {
  data: ExpenseRow[];
  projects: Project[];
  categories: string[];
  today: string;
  kind?: "REGULAR" | "IRREGULAR";
}) {
  const columns = React.useMemo(() => buildExpenseColumns(projects, categories), [projects, categories]);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="category"
      searchPlaceholder="Tìm theo danh mục…"
      toolbar={<AddExpenseDialog projects={projects} categories={categories} today={today} kind={kind} />}
    />
  );
}
