"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import { ExpenseRowActions } from "./expense-row-actions";
import type { ExpenseRow } from "./expenses-table";

export const expenseColumns: ColumnDef<ExpenseRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <ColumnHeader column={column} title="Ngày" />,
    cell: ({ row }) => row.original.date,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <ColumnHeader column={column} title="Danh mục" />,
    cell: ({ row }) => row.original.category,
  },
  {
    accessorKey: "projectLabel",
    header: "Dự án",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.projectLabel}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <ColumnHeader column={column} title="Số tiền" />,
    cell: ({ row }) => formatVnd(row.original.amount),
  },
  {
    id: "actions",
    cell: ({ row }) => <ExpenseRowActions expense={row.original} />,
  },
];
