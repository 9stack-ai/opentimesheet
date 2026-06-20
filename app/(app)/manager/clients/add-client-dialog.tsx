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
import { createClient } from "./actions";

export function AddClientDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4" />
          Thêm khách hàng
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khách hàng</DialogTitle>
        </DialogHeader>
        {/* createClient redirects to the new client page — dialog can stay open during redirect */}
        <form action={createClient} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Tên khách hàng</Label>
            <Input id="client-name" name="name" placeholder="Tên khách hàng" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-contact">Liên hệ (tuỳ chọn)</Label>
            <Input id="client-contact" name="contact" placeholder="Liên hệ" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-notes">Ghi chú (tuỳ chọn)</Label>
            <Input id="client-notes" name="notes" placeholder="Ghi chú" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit">Thêm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
