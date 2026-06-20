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
import { createProject } from "../../projects/actions";

export function AddProjectDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="size-4" />
          Thêm dự án
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm dự án mới</DialogTitle>
        </DialogHeader>
        {/* createProject redirects to the new project page */}
        <form action={createProject} className="flex flex-col gap-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid gap-2">
            <Label htmlFor="new-project-name">Tên dự án</Label>
            <Input
              id="new-project-name"
              name="name"
              placeholder="Tên dự án mới"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit">Thêm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
