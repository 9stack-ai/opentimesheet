"use client";

import { useActionState } from "react";
import { setPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetPasswordForm({ linkToken }: { linkToken: string }) {
  const [state, formAction, pending] = useActionState(setPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="linkToken" value={linkToken} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu mới (tối thiểu 8 ký tự)</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          placeholder="Nhập mật khẩu mới"
        />
      </div>
      {state && !state.ok ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Đang lưu…" : "Đặt mật khẩu"}
      </Button>
    </form>
  );
}
