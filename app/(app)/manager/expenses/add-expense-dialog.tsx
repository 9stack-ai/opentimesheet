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
import { createExpense } from "./actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Project = { id: string; clientName: string; name: string };

export function AddExpenseDialog({
  projects,
  today,
  kind = "REGULAR",
}: {
  projects: Project[];
  today: string;
  kind?: "REGULAR" | "IRREGULAR";
}) {
  const [open, setOpen] = React.useState(false);
  const label = kind === "IRREGULAR" ? "Thêm chi bất thường" : "Thêm chi phí";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <form
          action={createExpense}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="kind" value={kind} />
          <div className="grid gap-2">
            <Label htmlFor="expense-category">Danh mục</Label>
            <Input id="expense-category" name="category" placeholder="Danh mục" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expense-amount">Số tiền (VND)</Label>
            <Input
              id="expense-amount"
              name="amount"
              type="number"
              min={0}
              placeholder="Số tiền"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expense-date">Ngày</Label>
            <Input id="expense-date" name="date" type="date" defaultValue={today} required />
          </div>
          <div className="grid gap-2">
            <Label>Dự án (tuỳ chọn)</Label>
            <select name="projectId" defaultValue="" className={selectClass}>
              <option value="">Cấp công ty</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.clientName} / {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expense-note">Ghi chú (tuỳ chọn)</Label>
            <Input id="expense-note" name="note" placeholder="Ghi chú" />
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
