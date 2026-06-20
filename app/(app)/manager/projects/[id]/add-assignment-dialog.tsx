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
import { addAssignment } from "../actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Freelancer = { id: string; name: string };

export function AddAssignmentDialog({
  projectId,
  availableFreelancers,
}: {
  projectId: string;
  availableFreelancers: Freelancer[];
}) {
  const [open, setOpen] = React.useState(false);

  if (availableFreelancers.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="size-4" />
          Thêm thành viên
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thành viên</DialogTitle>
        </DialogHeader>
        <form
          action={addAssignment}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid gap-2">
            <Label>Cộng tác viên</Label>
            <select name="userId" required className={selectClass}>
              {availableFreelancers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="asgn-cost">Đơn giá vốn (tuỳ chọn)</Label>
              <Input
                id="asgn-cost"
                name="costRateOverride"
                type="number"
                min={0}
                placeholder="VND/giờ"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asgn-bill">Đơn giá bán (tuỳ chọn)</Label>
              <Input
                id="asgn-bill"
                name="billableRateOverride"
                type="number"
                min={0}
                placeholder="VND/giờ"
              />
            </div>
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
