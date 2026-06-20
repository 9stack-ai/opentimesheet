"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import type { BillingRow } from "./billing-table";

export const billingColumns: ColumnDef<BillingRow>[] = [
  {
    accessorKey: "clientName",
    header: ({ column }) => <ColumnHeader column={column} title="Khách hàng" />,
    cell: ({ row }) => <span className="font-medium">{row.original.clientName}</span>,
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => <ColumnHeader column={column} title="Dự án" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.projectName}</span>,
  },
  {
    accessorKey: "hours",
    header: ({ column }) => <ColumnHeader column={column} title="Số giờ" />,
    cell: ({ row }) => row.original.hours,
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => <ColumnHeader column={column} title="Doanh thu" />,
    cell: ({ row }) => formatVnd(row.original.revenue),
  },
];
