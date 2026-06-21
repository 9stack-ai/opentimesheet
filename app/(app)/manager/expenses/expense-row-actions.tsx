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

export function ExpenseRowActions({ expense }: { expense: ExpenseRow }) {
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
            <input type="hidden" name="kind" value={expense.kind} />
            {expense.projectId ? <input type="hidden" name="projectId" value={expense.projectId} /> : null}
            <div className="grid gap-2">
              <Label htmlFor={`cat-${expense.id}`}>Danh mục</Label>
              <Input id={`cat-${expense.id}`} name="category" defaultValue={expense.category} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`amt-${expense.id}`}>Số tiền (VND)</Label>
              <Input
                id={`amt-${expense.id}`}
                name="amount"
                type="number"
                min={0}
                defaultValue={expense.amount}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`date-${expense.id}`}>Ngày</Label>
              <Input id={`date-${expense.id}`} name="date" type="date" defaultValue={expense.date} required />
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
