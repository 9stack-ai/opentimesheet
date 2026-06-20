"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import type { ProfitabilityRow } from "./profitability-table";

export function buildProfitabilityColumns(
  isMonthly: boolean,
): ColumnDef<ProfitabilityRow>[] {
  const cols: ColumnDef<ProfitabilityRow>[] = [
    {
      accessorKey: "projectName",
      header: ({ column }) => <ColumnHeader column={column} title="Dự án" />,
      cell: ({ row }) => <span className="font-medium">{row.original.projectName}</span>,
    },
    {
      accessorKey: "approvedHours",
      header: ({ column }) => <ColumnHeader column={column} title="Số giờ" />,
      cell: ({ row }) => row.original.approvedHours,
    },
    {
      accessorKey: "revenue",
      header: ({ column }) => <ColumnHeader column={column} title="Doanh thu" />,
      cell: ({ row }) => formatVnd(row.original.revenue),
    },
    {
      accessorKey: "directCost",
      header: ({ column }) => <ColumnHeader column={column} title="Chi phí trực tiếp" />,
      cell: ({ row }) => formatVnd(row.original.directCost),
    },
  ];

  if (isMonthly) {
    cols.push({
      accessorKey: "allocatedFixed",
      header: ({ column }) => <ColumnHeader column={column} title="Phân bổ CĐ" />,
      cell: ({ row }) => formatVnd(row.original.allocatedFixed),
    });
  }

  cols.push({
    accessorKey: "net",
    header: ({ column }) => <ColumnHeader column={column} title="Lãi/Lỗ ròng" />,
    cell: ({ row }) => (
      <span className={row.original.net < 0 ? "text-destructive" : ""}>
        {formatVnd(row.original.net)}
      </span>
    ),
  });

  return cols;
}
