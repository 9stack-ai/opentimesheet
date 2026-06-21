"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { Badge } from "@/components/ui/badge";
import { formatVnd } from "@/lib/money";
import { FixedCostRowActions } from "./fixed-cost-row-actions";
import type { FixedCostRow } from "./fixed-costs-table";

/** Columns factory — threads known categories into the per-row edit dialog. */
export function buildFixedCostColumns(categories: string[]): ColumnDef<FixedCostRow>[] {
  return [
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
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) =>
        row.original.active ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Đang áp dụng</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Ngoài hiệu lực</span>
        ),
    },
    {
      id: "actions",
      cell: ({ row }) => <FixedCostRowActions fixedCost={row.original} categories={categories} />,
    },
  ];
}
