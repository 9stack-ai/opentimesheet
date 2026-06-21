"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEntry, deleteEntry } from "./actions";
import type { EntryRow } from "./entries-table";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Task = { id: string; label: string };

export function EntryRowActions({
  entry,
  tasks,
  targetUserId,
  canEditAll = false,
}: {
  entry: EntryRow;
  tasks: Task[];
  // Set (ADMIN only) when acting on behalf of another user.
  targetUserId?: string;
  // ADMIN may edit/delete entries in any status.
  canEditAll?: boolean;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  // An entry already pushed to Redmine is locked to avoid diverging from its Redmine time entry.
  const lockedByRedmine = entry.redminePushStatus === "pushed";
  const canEdit =
    (canEditAll || entry.status === "DRAFT" || entry.status === "REJECTED") && !lockedByRedmine;

  if (!canEdit) return null;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Thao tác</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            Sửa
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <form action={deleteEntry} className="w-full">
              <input type="hidden" name="id" value={entry.id} />
              {targetUserId ? <input type="hidden" name="targetUserId" value={targetUserId} /> : null}
              <button type="submit" className="w-full cursor-pointer text-left text-destructive">
                Xoá
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa dòng công</DialogTitle>
          </DialogHeader>
          <form
            action={updateEntry}
            onSubmit={() => setEditOpen(false)}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="id" value={entry.id} />
            {targetUserId ? <input type="hidden" name="targetUserId" value={targetUserId} /> : null}
            <div className="grid gap-2">
              <Label>Công việc</Label>
              <select
                name="taskId"
                defaultValue={entry.taskId}
                className={selectClass}
                aria-label="Công việc"
              >
                {tasks.some((t) => t.id === entry.taskId) ? null : (
                  <option value={entry.taskId}>{entry.taskLabel} (hiện tại)</option>
                )}
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-date-${entry.id}`}>Ngày</Label>
              <Input
                id={`edit-date-${entry.id}`}
                name="date"
                type="date"
                defaultValue={entry.date}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-hours-${entry.id}`}>Số giờ</Label>
              <Input
                id={`edit-hours-${entry.id}`}
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                defaultValue={entry.hours}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-note-${entry.id}`}>Ghi chú</Label>
              <Input
                id={`edit-note-${entry.id}`}
                name="note"
                defaultValue={entry.note ?? ""}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Huỷ
                </Button>
              </DialogClose>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
