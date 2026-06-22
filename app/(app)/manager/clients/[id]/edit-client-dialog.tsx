"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
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
import { updateClient } from "../actions";

type Client = {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
};

export function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Sửa thông tin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa khách hàng</DialogTitle>
        </DialogHeader>
        <form
          action={updateClient}
          onSubmit={() => setOpen(false)}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={client.id} />
          <div className="grid gap-2">
            <Label htmlFor="edit-client-name">Tên</Label>
            <Input
              id="edit-client-name"
              name="name"
              defaultValue={client.name}
              placeholder="Tên"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-client-contact">Liên hệ</Label>
            <Input
              id="edit-client-contact"
              name="contact"
              defaultValue={client.contact ?? ""}
              placeholder="Liên hệ"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-client-notes">Ghi chú</Label>
            <Input
              id="edit-client-notes"
              name="notes"
              defaultValue={client.notes ?? ""}
              placeholder="Ghi chú"
            />
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
