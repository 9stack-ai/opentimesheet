"use client";

import { useActionState } from "react";
import { inviteUser, type InviteResult } from "./actions";
import { ROLES } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteUser,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mời người dùng</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-name">Họ tên</Label>
              <Input id="invite-name" name="name" placeholder="Họ và tên" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" placeholder="email@example.com" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">Vai trò</Label>
              <select id="invite-role" name="role" defaultValue="FREELANCER" className={selectClass}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-cost-rate">Đơn giá vốn (VND/giờ)</Label>
              <Input
                id="invite-cost-rate"
                name="defaultCostRate"
                type="number"
                min={0}
                placeholder="Đơn giá vốn"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-billable-rate">Đơn giá bán (VND/giờ)</Label>
              <Input
                id="invite-billable-rate"
                name="defaultBillableRate"
                type="number"
                min={0}
                placeholder="Đơn giá bán"
              />
            </div>
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang mời…" : "Mời"}
            </Button>
          </div>
          {state ? (
            state.ok ? (
              <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {state.message} Link mời (chia sẻ thủ công):{" "}
                <code className="break-all rounded bg-muted px-1">{state.inviteLink}</code>
              </div>
            ) : (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            )
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
