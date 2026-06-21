"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import { IncomeRowActions } from "./income-row-actions";
import type { IncomeRow } from "./income-table";

type Project = { id: string; clientName: string; name: string };

/** Columns factory — threads the project list into the per-row edit dialog. */
export function buildIncomeColumns(projects: Project[]): ColumnDef<IncomeRow>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <ColumnHeader column={column} title="Ngày" />,
      cell: ({ row }) =>
        row.original.date ?? <span className="text-muted-foreground">— chưa đặt</span>,
    },
    {
      accessorKey: "source",
      header: ({ column }) => <ColumnHeader column={column} title="Nguồn thu" />,
      cell: ({ row }) => row.original.source,
    },
    {
      accessorKey: "projectLabel",
      header: "Dự án",
      cell: ({ row }) =>
        row.original.projectLabel ?? <span className="text-muted-foreground">Cấp công ty</span>,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <ColumnHeader column={column} title="Số tiền" />,
      cell: ({ row }) => formatVnd(row.original.amount),
    },
    {
      id: "actions",
      cell: ({ row }) => <IncomeRowActions income={row.original} projects={projects} />,
    },
  ];
}
