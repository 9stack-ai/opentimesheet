"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { EntryStatusBadge } from "@/components/status-badge";
import { EntryRowActions } from "./entry-row-actions";
import type { EntryRow } from "./entries-table";

type Task = { id: string; label: string };

type RowActionOptions = { targetUserId?: string; canEditAll?: boolean };

export function buildEntryColumns(
  tasks: Task[],
  opts: RowActionOptions = {},
): ColumnDef<EntryRow>[] {
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
      cell: ({ row }) => {
        const ps = row.original.redminePushStatus;
        return (
          <div className="flex flex-col gap-1">
            <EntryStatusBadge status={row.original.status} />
            {ps && ps !== "pending" && ps !== "skipped" ? (
              <span className={`text-xs ${ps === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                {ps === "pushed" ? "↑ Đã đẩy Redmine" : ps === "pushing" ? "Đang đẩy Redmine…" : "Redmine: lỗi đẩy"}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <EntryRowActions
          entry={row.original}
          tasks={tasks}
          targetUserId={opts.targetUserId}
          canEditAll={opts.canEditAll}
        />
      ),
    },
  ];
}
