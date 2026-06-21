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
import { updateExpense, deleteExpense } from "./actions";
import type { ExpenseRow } from "./expenses-table";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type Project = { id: string; clientName: string; name: string };

export function ExpenseRowActions({
  expense,
  projects,
  categories,
}: {
  expense: ExpenseRow;
  projects: Project[];
  categories: string[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const listId = `expense-cats-${expense.id}`;

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
            <form action={deleteExpense} className="w-full">
              <input type="hidden" name="id" value={expense.id} />
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
            <DialogTitle>Sửa khoản chi</DialogTitle>
          </DialogHeader>
          <form action={updateExpense} onSubmit={() => setEditOpen(false)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={expense.id} />
            <div className="grid gap-2">
              <Label htmlFor={`cat-${expense.id}`}>Danh mục</Label>
              <Input
                id={`cat-${expense.id}`}
                name="category"
                list={listId}
                defaultValue={expense.category}
                required
              />
              <datalist id={listId}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`amt-${expense.id}`}>Số tiền (VND)</Label>
              <Input
                id={`amt-${expense.id}`}
                name="amount"
                type="number"
                min={1}
                defaultValue={expense.amount}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`date-${expense.id}`}>Ngày</Label>
              <Input id={`date-${expense.id}`} name="date" type="date" defaultValue={expense.date} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`proj-${expense.id}`}>Dự án</Label>
              <select
                id={`proj-${expense.id}`}
                name="projectId"
                defaultValue={expense.projectId ?? ""}
                className={selectClass}
              >
                <option value="">Cấp công ty</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName} / {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`kind-${expense.id}`}>Loại</Label>
              <select id={`kind-${expense.id}`} name="kind" defaultValue={expense.kind} className={selectClass}>
                <option value="REGULAR">Chi phí thường</option>
                <option value="IRREGULAR">Chi bất thường</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`note-${expense.id}`}>Ghi chú (tuỳ chọn)</Label>
              <Input id={`note-${expense.id}`} name="note" defaultValue={expense.note ?? ""} />
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
