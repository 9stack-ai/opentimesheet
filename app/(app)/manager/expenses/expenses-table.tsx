"use client";

import { DataTable } from "@/components/data-table/data-table";
import { expenseColumns } from "./expenses-columns";
import { AddExpenseDialog } from "./add-expense-dialog";

export type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  projectLabel: string;
  amount: number;
};

type Project = { id: string; clientName: string; name: string };

export function ExpensesTable({
  data,
  projects,
  today,
}: {
  data: ExpenseRow[];
  projects: Project[];
  today: string;
}) {
  return (
    <DataTable
      columns={expenseColumns}
      data={data}
      searchKey="category"
      searchPlaceholder="Tìm theo danh mục…"
      toolbar={<AddExpenseDialog projects={projects} today={today} />}
    />
  );
}
