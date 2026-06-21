"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import type { PayoutRow } from "./payout-table";

/** Columns for the payout table. The name links to the per-collaborator detail page,
 *  preserving the current period via `periodQuery` (e.g. "month=2026-06"). */
export function buildPayoutColumns(periodQuery: string): ColumnDef<PayoutRow>[] {
  return [
    {
      accessorKey: "userName",
      header: ({ column }) => <ColumnHeader column={column} title="Cộng tác viên" />,
      cell: ({ row }) => (
        <Link
          href={`/manager/reports/payout/${row.original.userId}?${periodQuery}`}
          className="font-medium hover:underline"
        >
          {row.original.userName}
        </Link>
      ),
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
}
