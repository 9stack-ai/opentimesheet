"use client";

import * as React from "react";
import { useActionState } from "react";
import { UserCog } from "lucide-react";
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
import { createUserWithPassword, type InviteResult } from "./actions";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function CreateUserDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<InviteResult | undefined, FormData>(
    createUserWithPassword,
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCog className="size-4" />
          Tạo tài khoản
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản</DialogTitle>
          <DialogDescription>
            Tạo người dùng và đặt mật khẩu trực tiếp — tài khoản kích hoạt ngay.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-name">Họ tên</Label>
            <Input id="create-name" name="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-email">Tên đăng nhập (username)</Label>
            <Input id="create-email" name="email" type="text" autoComplete="off" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-contact">Email (liên hệ, tuỳ chọn)</Label>
            <Input id="create-contact" name="contactEmail" type="email" placeholder="email@congty.vn" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-password">Mật khẩu</Label>
            <Input
              id="create-password"
              name="password"
              type="password"
              minLength={8}
              placeholder="Tối thiểu 8 ký tự"
              required
            />
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
            {pending ? "Đang tạo…" : "Tạo tài khoản"}
          </Button>
          {state ? (
            state.ok ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {state.message}
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
