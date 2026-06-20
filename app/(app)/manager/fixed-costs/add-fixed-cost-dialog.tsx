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
import { createFixedCost } from "./actions";

export function AddFixedCostDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          Thêm chi phí cố định
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm chi phí cố định</DialogTitle>
        </DialogHeader>
        <form
          action={createFixedCost}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="fc-name">Tên</Label>
            <Input id="fc-name" name="name" placeholder="Tên" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fc-category">Danh mục</Label>
            <Input id="fc-category" name="category" placeholder="Danh mục" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fc-monthly">Hàng tháng (VND)</Label>
            <Input
              id="fc-monthly"
              name="monthlyAmount"
              type="number"
              min={0}
              placeholder="Số tiền"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="fc-from">Từ ngày</Label>
              <Input id="fc-from" name="effectiveFrom" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fc-to">Đến ngày (tuỳ chọn)</Label>
              <Input id="fc-to" name="effectiveTo" type="date" />
            </div>
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
