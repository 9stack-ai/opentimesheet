"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import type { PayoutRow } from "./payout-table";

export const payoutColumns: ColumnDef<PayoutRow>[] = [
  {
    accessorKey: "userName",
    header: ({ column }) => <ColumnHeader column={column} title="Cộng tác viên" />,
    cell: ({ row }) => <span className="font-medium">{row.original.userName}</span>,
  },
  {
    accessorKey: "totalHours",
    header: ({ column }) => <ColumnHeader column={column} title="Số giờ" />,
    cell: ({ row }) => row.original.totalHours,
  },
  {
    accessorKey: "payout",
    header: ({ column }) => <ColumnHeader column={column} title="Chi trả (VND)" />,
    cell: ({ row }) => formatVnd(row.original.payout),
  },
];
