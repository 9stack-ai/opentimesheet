"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import { ExpenseRowActions } from "./expense-row-actions";
import type { ExpenseRow } from "./expenses-table";

type Project = { id: string; clientName: string; name: string };

/** Columns factory — threads the project list & known categories into the per-row edit dialog. */
export function buildExpenseColumns(projects: Project[], categories: string[]): ColumnDef<ExpenseRow>[] {
  return [
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
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.projectLabel}</span>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <ColumnHeader column={column} title="Số tiền" />,
      cell: ({ row }) => formatVnd(row.original.amount),
    },
    {
      id: "actions",
      cell: ({ row }) => <ExpenseRowActions expense={row.original} projects={projects} categories={categories} />,
    },
  ];
}
