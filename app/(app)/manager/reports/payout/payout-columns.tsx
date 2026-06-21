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
    accessorKey: "gross",
    header: ({ column }) => <ColumnHeader column={column} title="Gộp (trước thuế)" />,
    cell: ({ row }) => formatVnd(row.original.gross),
  },
  {
    accessorKey: "taxWithheld",
    header: ({ column }) => <ColumnHeader column={column} title="Thuế giữ lại" />,
    cell: ({ row }) => formatVnd(row.original.taxWithheld),
  },
  {
    accessorKey: "net",
    header: ({ column }) => <ColumnHeader column={column} title="Thực nhận" />,
    cell: ({ row }) => <span className="font-medium">{formatVnd(row.original.net)}</span>,
  },
  {
    accessorKey: "employerCost",
    header: ({ column }) => <ColumnHeader column={column} title="BH công ty" />,
    cell: ({ row }) => formatVnd(row.original.employerCost),
  },
  {
    accessorKey: "totalCompanyCost",
    header: ({ column }) => <ColumnHeader column={column} title="Tổng chi phí" />,
    cell: ({ row }) => formatVnd(row.original.totalCompanyCost),
  },
];
