"use client";

import * as React from "react";
import { useActionState } from "react";
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
import { ROLES } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { bpsToPercent } from "@/lib/payroll";
import { updateUser, setUserStatus, adminSetPassword, type SetPasswordResult } from "./actions";
import type { UserRow } from "./types";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function UserRowActions({ user }: { user: UserRow }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [pwState, pwAction, pwPending] = useActionState<SetPasswordResult | undefined, FormData>(
    adminSetPassword,
    undefined,
  );
  const disabled = user.status === "DISABLED";

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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setPasswordOpen(true);
            }}
          >
            Đặt lại mật khẩu
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <form action={setUserStatus} className="w-full">
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="status" value={disabled ? "ACTIVE" : "DISABLED"} />
              <button type="submit" className="w-full cursor-pointer text-left">
                {disabled ? "Kích hoạt" : "Vô hiệu hoá"}
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa người dùng</DialogTitle>
          </DialogHeader>
          <form action={updateUser} onSubmit={() => setEditOpen(false)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={user.id} />
            <div className="grid gap-2">
              <Label htmlFor={`name-${user.id}`}>Tên hiển thị</Label>
              <Input id={`name-${user.id}`} name="name" defaultValue={user.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`username-${user.id}`}>Tên đăng nhập (username)</Label>
              <Input id={`username-${user.id}`} name="email" defaultValue={user.email} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`contact-${user.id}`}>Email (liên hệ)</Label>
              <Input
                id={`contact-${user.id}`}
                name="contactEmail"
                type="email"
                defaultValue={user.contactEmail ?? ""}
                placeholder="email@congty.vn"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vai trò</Label>
              <select name="role" defaultValue={user.role} className={selectClass}>
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
                <Input name="defaultCostRate" type="number" min={0} defaultValue={user.defaultCostRate} />
              </div>
              <div className="grid gap-2">
                <Label>Đơn giá bán</Label>
                <Input name="defaultBillableRate" type="number" min={0} defaultValue={user.defaultBillableRate} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>% thuế giữ lại (TNCN)</Label>
                <Input
                  name="taxWithholdingPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={bpsToPercent(user.taxWithholdingRateBps)}
                />
              </div>
              <div className="grid gap-2">
                <Label>% BH công ty</Label>
                <Input
                  name="employerCostPercent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={bpsToPercent(user.employerCostRateBps)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Huỷ
                </Button>
              </DialogClose>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu — {user.name}</DialogTitle>
          </DialogHeader>
          <form action={pwAction} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={user.id} />
            <div className="grid gap-2">
              <Label htmlFor={`password-${user.id}`}>Mật khẩu mới</Label>
              <Input
                id={`password-${user.id}`}
                name="password"
                type="password"
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
                required
              />
            </div>
            {pwState ? (
              <p className={`text-sm ${pwState.ok ? "text-emerald-700" : "text-destructive"}`}>
                {pwState.message}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Đóng
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pwPending}>
                {pwPending ? "Đang lưu…" : "Lưu mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
