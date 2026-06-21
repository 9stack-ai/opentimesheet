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
import { roleLabel } from "@/lib/labels";
import { createDisbursement } from "./actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type UserOption = { id: string; name: string; role: string };

export function AddDisbursementDialog({ users, today }: { users: UserOption[]; today: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          Ghi thực chi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi thực chi</DialogTitle>
        </DialogHeader>
        <form action={createDisbursement} onSubmit={() => setOpen(false)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="disb-user">Người nhận</Label>
            <select id="disb-user" name="userId" required defaultValue="" className={selectClass}>
              <option value="" disabled>
                Chọn người…
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({roleLabel(u.role)})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="disb-amount">Số tiền đã trả (VND)</Label>
            <Input id="disb-amount" name="amount" type="number" min={0} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="disb-date">Ngày trả</Label>
            <Input id="disb-date" name="date" type="date" defaultValue={today} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="disb-note">Ghi chú (tuỳ chọn)</Label>
            <Input id="disb-note" name="note" placeholder="VD: chuyển khoản đợt 1" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <SubmitButton>Lưu</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
