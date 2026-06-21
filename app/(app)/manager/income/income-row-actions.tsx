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
import { SubmitButton } from "@/components/ui/submit-button";
import { updateIncome, deleteIncome } from "./actions";
import type { IncomeRow } from "./income-table";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Project = { id: string; clientName: string; name: string };

export function IncomeRowActions({
  income,
  projects,
}: {
  income: IncomeRow;
  projects: Project[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);

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
            <form action={deleteIncome} className="w-full">
              <input type="hidden" name="id" value={income.id} />
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
            <DialogTitle>Sửa nguồn thu</DialogTitle>
          </DialogHeader>
          <form action={updateIncome} onSubmit={() => setEditOpen(false)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={income.id} />
            <div className="grid gap-2">
              <Label htmlFor={`source-${income.id}`}>Nguồn thu</Label>
              <Input id={`source-${income.id}`} name="source" defaultValue={income.source} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`amount-${income.id}`}>Số tiền (VND)</Label>
              <Input
                id={`amount-${income.id}`}
                name="amount"
                type="number"
                min={1}
                defaultValue={income.amount}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`proj-${income.id}`}>Dự án</Label>
              <select
                id={`proj-${income.id}`}
                name="projectId"
                defaultValue={income.projectId ?? ""}
                className={selectClass}
              >
                <option value="">Cấp công ty (không gắn dự án)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName} / {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`date-${income.id}`}>Ngày (tuỳ chọn)</Label>
              <Input id={`date-${income.id}`} name="date" type="date" defaultValue={income.date ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`note-${income.id}`}>Ghi chú (tuỳ chọn)</Label>
              <Input id={`note-${income.id}`} name="note" defaultValue={income.note ?? ""} />
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
    </div>
  );
}
