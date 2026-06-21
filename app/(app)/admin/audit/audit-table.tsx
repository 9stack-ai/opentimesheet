"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { roleLabel } from "@/lib/labels";

export type AuditRow = {
  id: string;
  time: string;
  actor: string;
  role: string;
  action: string;
  summary: string;
};

const columns: ColumnDef<AuditRow>[] = [
  {
    accessorKey: "time",
    header: ({ column }) => <ColumnHeader column={column} title="Thời gian" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">{row.original.time}</span>
    ),
  },
  {
    accessorKey: "actor",
    header: ({ column }) => <ColumnHeader column={column} title="Người" />,
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.actor}{" "}
        <span className="text-xs text-muted-foreground">({roleLabel(row.original.role)})</span>
      </span>
    ),
  },
  {
    accessorKey: "action",
    header: "Hành động",
    cell: ({ row }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.original.action}</code>
    ),
  },
  {
    accessorKey: "summary",
    header: "Chi tiết",
    cell: ({ row }) => row.original.summary,
  },
];

export function AuditTable({ data }: { data: AuditRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="summary"
      searchPlaceholder="Tìm trong chi tiết…"
      pageSize={20}
    />
  );
}
