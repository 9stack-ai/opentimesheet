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
import { SubmitButton } from "@/components/ui/submit-button";
import { createTask } from "../actions";

export function AddTaskDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="size-4" />
          Thêm hạng mục
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm hạng mục</DialogTitle>
        </DialogHeader>
        <form
          action={createTask}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid gap-2">
            <Label htmlFor="task-name">Tên hạng mục</Label>
            <Input id="task-name" name="name" placeholder="Tên hạng mục" required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <SubmitButton>Thêm</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
