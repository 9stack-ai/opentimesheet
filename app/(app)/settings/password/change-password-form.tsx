"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type ChangePasswordResult } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordResult | undefined, FormData>(
    changePassword,
    undefined,
  );
  const formRef = React.useRef<HTMLFormElement>(null);

  // Clear the fields after a successful change.
  React.useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-password">Mật khẩu mới</Label>
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Nhập lại mật khẩu mới</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Đang đổi…" : "Đổi mật khẩu"}
      </Button>
      {state ? (
        <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
