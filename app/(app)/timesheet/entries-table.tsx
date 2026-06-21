"use client";

import { DataTable } from "@/components/data-table/data-table";
import { buildEntryColumns } from "./entries-columns";
import { AddEntryDialog } from "./add-entry-dialog";

export type EntryRow = {
  id: string;
  date: string;
  taskId: string;
  taskLabel: string;
  hours: string;
  status: string;
  note: string | null;
  rejectReason: string | null;
  redminePushStatus: string | null;
};

type Task = { id: string; label: string };

export function EntriesTable({
  data,
  tasks,
  today,
  targetUserId,
  canEditAll = false,
}: {
  data: EntryRow[];
  tasks: Task[];
  today: string;
  // Set (ADMIN only) when acting on behalf of another user; forwarded to the action forms.
  targetUserId?: string;
  // ADMIN may edit entries in any status, not just DRAFT/REJECTED.
  canEditAll?: boolean;
}) {
  const columns = buildEntryColumns(tasks, { targetUserId, canEditAll });
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="taskLabel"
      searchPlaceholder="Tìm theo công việc…"
      toolbar={
        tasks.length > 0 ? (
          <AddEntryDialog tasks={tasks} today={today} targetUserId={targetUserId} />
        ) : undefined
      }
    />
  );
}
