"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { EntryStatusBadge } from "@/components/status-badge";
import { EntryRowActions } from "./entry-row-actions";
import type { EntryRow } from "./entries-table";

type Task = { id: string; label: string };

export function buildEntryColumns(tasks: Task[]): ColumnDef<EntryRow>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <ColumnHeader column={column} title="Ngày" />,
      cell: ({ row }) => row.original.date,
    },
    {
      accessorKey: "taskLabel",
      header: "Công việc",
      cell: ({ row }) => (
        <div>
          <span>{row.original.taskLabel}</span>
          {row.original.note ? (
            <p className="text-xs text-muted-foreground">{row.original.note}</p>
          ) : null}
          {row.original.rejectReason ? (
            <p className="text-xs text-destructive">Từ chối: {row.original.rejectReason}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "hours",
      header: ({ column }) => <ColumnHeader column={column} title="Số giờ" />,
      cell: ({ row }) => row.original.hours,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <EntryStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => <EntryRowActions entry={row.original} tasks={tasks} />,
    },
  ];
}
