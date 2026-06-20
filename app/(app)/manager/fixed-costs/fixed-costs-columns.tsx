"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { formatVnd } from "@/lib/money";
import { FixedCostRowActions } from "./fixed-cost-row-actions";
import type { FixedCostRow } from "./fixed-costs-table";

export const fixedCostColumns: ColumnDef<FixedCostRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Tên" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => row.original.category,
  },
  {
    accessorKey: "monthlyAmount",
    header: ({ column }) => <ColumnHeader column={column} title="Hàng tháng" />,
    cell: ({ row }) => formatVnd(row.original.monthlyAmount),
  },
  {
    accessorKey: "effectiveFrom",
    header: "Từ",
    cell: ({ row }) => row.original.effectiveFrom,
  },
  {
    accessorKey: "effectiveTo",
    header: "Đến",
    cell: ({ row }) => row.original.effectiveTo ?? "—",
  },
  {
    id: "actions",
    cell: ({ row }) => <FixedCostRowActions fixedCost={row.original} />,
  },
];
