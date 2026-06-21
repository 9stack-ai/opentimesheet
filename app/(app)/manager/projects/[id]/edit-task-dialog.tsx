"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateTask } from "../actions";

export function EditTaskDialog({
  taskId,
  projectId,
  name,
}: {
  taskId: string;
  projectId: string;
  name: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Sửa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa hạng mục</DialogTitle>
        </DialogHeader>
        <form action={updateTask} onSubmit={() => setOpen(false)} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={taskId} />
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid gap-2">
            <Label htmlFor={`task-name-${taskId}`}>Tên hạng mục</Label>
            <Input id={`task-name-${taskId}`} name="name" defaultValue={name} required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Huỷ
              </Button>
            </DialogClose>
            <SubmitButton>Lưu</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
