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
import { addAssignment } from "../actions";

/** Edit an existing member's rate overrides. Reuses addAssignment (upsert by project+user).
 *  Leaving a field blank clears the override (falls back to the user's default rate). */
export function EditAssignmentDialog({
  projectId,
  userId,
  userName,
  costRateOverride,
  billableRateOverride,
}: {
  projectId: string;
  userId: string;
  userName: string;
  costRateOverride: number | null;
  billableRateOverride: number | null;
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
          <DialogTitle>Sửa đơn giá — {userName}</DialogTitle>
        </DialogHeader>
        <form action={addAssignment} onSubmit={() => setOpen(false)} className="flex flex-col gap-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="userId" value={userId} />
          <div className="grid gap-2">
            <Label htmlFor={`cost-${userId}`}>Đơn giá vốn (để trống = mặc định)</Label>
            <Input
              id={`cost-${userId}`}
              name="costRateOverride"
              type="number"
              min={0}
              defaultValue={costRateOverride ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`bill-${userId}`}>Đơn giá bán (để trống = mặc định)</Label>
            <Input
              id={`bill-${userId}`}
              name="billableRateOverride"
              type="number"
              min={0}
              defaultValue={billableRateOverride ?? ""}
            />
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
