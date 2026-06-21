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
import { roleLabel } from "@/lib/labels";
import { updateDisbursement, deleteDisbursement } from "./actions";
import type { DisbursementRow } from "@/lib/disbursement-db";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type UserOption = { id: string; name: string; role: string };

export function DisbursementRowActions({
  disbursement: d,
  users,
}: {
  disbursement: DisbursementRow;
  users: UserOption[];
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
            <form action={deleteDisbursement} className="w-full">
              <input type="hidden" name="id" value={d.id} />
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
            <DialogTitle>Sửa thực chi</DialogTitle>
          </DialogHeader>
          <form action={updateDisbursement} onSubmit={() => setEditOpen(false)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={d.id} />
            <div className="grid gap-2">
              <Label htmlFor={`disb-user-${d.id}`}>Người nhận</Label>
              <select id={`disb-user-${d.id}`} name="userId" required defaultValue={d.userId} className={selectClass}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({roleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`disb-amount-${d.id}`}>Số tiền đã trả (VND)</Label>
              <Input
                id={`disb-amount-${d.id}`}
                name="amount"
                type="number"
                min={1}
                defaultValue={d.amount}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`disb-date-${d.id}`}>Ngày trả</Label>
              <Input id={`disb-date-${d.id}`} name="date" type="date" defaultValue={d.date} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`disb-period-${d.id}`}>Kỳ lương (tuỳ chọn)</Label>
              <Input id={`disb-period-${d.id}`} name="periodLabel" type="month" defaultValue={d.periodLabel} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`disb-note-${d.id}`}>Ghi chú (tuỳ chọn)</Label>
              <Input id={`disb-note-${d.id}`} name="note" defaultValue={d.note ?? ""} />
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
