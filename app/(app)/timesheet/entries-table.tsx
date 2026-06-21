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
}: {
  data: EntryRow[];
  tasks: Task[];
  today: string;
}) {
  const columns = buildEntryColumns(tasks);
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="taskLabel"
      searchPlaceholder="Tìm theo công việc…"
      toolbar={tasks.length > 0 ? <AddEntryDialog tasks={tasks} today={today} /> : undefined}
    />
  );
}
