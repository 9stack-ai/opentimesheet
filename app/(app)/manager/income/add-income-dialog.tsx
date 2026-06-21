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
import { createIncome } from "./actions";

export function AddIncomeDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          Thêm nguồn thu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm nguồn thu</DialogTitle>
        </DialogHeader>
        <form action={createIncome} onSubmit={() => setOpen(false)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="income-source">Nguồn thu</Label>
            <Input id="income-source" name="source" placeholder="VD: 30% Benadep, Tạm ứng AI First…" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-amount">Số tiền (VND)</Label>
            <Input id="income-amount" name="amount" type="number" min={0} placeholder="Số tiền" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-date">Ngày (tuỳ chọn)</Label>
            <Input id="income-date" name="date" type="date" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="income-note">Ghi chú (tuỳ chọn)</Label>
            <Input id="income-note" name="note" placeholder="Ghi chú" />
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
