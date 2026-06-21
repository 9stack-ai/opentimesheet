"use client";

import * as React from "react";
import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { inviteUser, type InviteResult } from "./actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function InviteDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteUser,
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Mời người dùng
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời người dùng</DialogTitle>
          <DialogDescription>
            Tạo tài khoản và lấy liên kết đặt mật khẩu để gửi cho họ.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-name">Họ tên</Label>
            <Input id="invite-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Tên đăng nhập (username)</Label>
            <Input id="invite-email" name="email" type="text" autoComplete="off" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-contact">Email (liên hệ, tuỳ chọn)</Label>
            <Input id="invite-contact" name="contactEmail" type="email" placeholder="email@congty.vn" />
          </div>
          <div className="grid gap-2">
            <Label>Vai trò</Label>
            <select name="role" defaultValue="FREELANCER" className={selectClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Đơn giá vốn</Label>
              <Input name="defaultCostRate" type="number" min={0} placeholder="VND/giờ" />
            </div>
            <div className="grid gap-2">
              <Label>Đơn giá bán</Label>
              <Input name="defaultBillableRate" type="number" min={0} placeholder="VND/giờ" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>% thuế giữ lại (TNCN)</Label>
              <Input name="taxWithholdingPercent" type="number" min={0} max={100} step="0.01" placeholder="vd 10 (CTV)" />
            </div>
            <div className="grid gap-2">
              <Label>% BH công ty</Label>
              <Input name="employerCostPercent" type="number" min={0} max={100} step="0.01" placeholder="vd 21.5 (NV)" />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Đang mời…" : "Gửi lời mời"}
          </Button>
          {state ? (
            state.ok ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {state.message} Liên kết đặt mật khẩu:{" "}
                <code className="break-all">{state.inviteLink}</code>
              </div>
            ) : (
              <p className="text-sm text-destructive">{state.message}</p>
            )
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
