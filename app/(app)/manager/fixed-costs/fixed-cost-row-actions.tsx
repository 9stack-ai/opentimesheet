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
import { updateFixedCost, deleteFixedCost } from "./actions";
import type { FixedCostRow } from "./fixed-costs-table";

export function FixedCostRowActions({
  fixedCost,
  categories,
}: {
  fixedCost: FixedCostRow;
  categories: string[];
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const listId = `fc-cats-${fixedCost.id}`;

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
            <form action={deleteFixedCost} className="w-full">
              <input type="hidden" name="id" value={fixedCost.id} />
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
            <DialogTitle>Sửa chi phí cố định</DialogTitle>
          </DialogHeader>
          <form action={updateFixedCost} onSubmit={() => setEditOpen(false)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={fixedCost.id} />
            <div className="grid gap-2">
              <Label htmlFor={`fc-name-${fixedCost.id}`}>Tên</Label>
              <Input id={`fc-name-${fixedCost.id}`} name="name" defaultValue={fixedCost.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`fc-cat-${fixedCost.id}`}>Danh mục</Label>
              <Input
                id={`fc-cat-${fixedCost.id}`}
                name="category"
                list={listId}
                defaultValue={fixedCost.category}
                required
              />
              <datalist id={listId}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`fc-amt-${fixedCost.id}`}>Hàng tháng (VND)</Label>
              <Input
                id={`fc-amt-${fixedCost.id}`}
                name="monthlyAmount"
                type="number"
                min={1}
                defaultValue={fixedCost.monthlyAmount}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor={`fc-from-${fixedCost.id}`}>Từ ngày</Label>
                <Input
                  id={`fc-from-${fixedCost.id}`}
                  name="effectiveFrom"
                  type="date"
                  defaultValue={fixedCost.effectiveFrom}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`fc-to-${fixedCost.id}`}>Đến ngày (tuỳ chọn)</Label>
                <Input
                  id={`fc-to-${fixedCost.id}`}
                  name="effectiveTo"
                  type="date"
                  defaultValue={fixedCost.effectiveTo ?? ""}
                />
              </div>
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
