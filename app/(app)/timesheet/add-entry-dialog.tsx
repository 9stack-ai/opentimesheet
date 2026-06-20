"use client";

import * as React from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntry } from "./actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Task = { id: string; label: string };

export function AddEntryDialog({
  tasks,
  today,
}: {
  tasks: Task[];
  today: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          Ghi công
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi giờ làm</DialogTitle>
        </DialogHeader>
        <form
          action={createEntry}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label>Công việc</Label>
            <select name="taskId" required className={selectClass} aria-label="Công việc">
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-date">Ngày</Label>
            <Input id="entry-date" name="date" type="date" defaultValue={today} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-hours">Số giờ</Label>
            <Input
              id="entry-hours"
              name="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              placeholder="Số giờ"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-note">Ghi chú (tuỳ chọn)</Label>
            <Input id="entry-note" name="note" placeholder="Ghi chú" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
