"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectRedmine, type RedmineConnectResult } from "./actions";

export function RedmineConnectForm({ redmineUrl }: { redmineUrl: string }) {
  const [state, formAction, pending] = useActionState<RedmineConnectResult | undefined, FormData>(
    connectRedmine,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Liên kết tài khoản</CardTitle>
        <CardDescription>
          Máy chủ: {redmineUrl}. Lấy API key trong Redmine → &quot;My account&quot; → API access key.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="redmine-key">API key</Label>
            <Input
              id="redmine-key"
              name="apiKey"
              type="password"
              autoComplete="off"
              required
              placeholder="Khoá API Redmine của bạn"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Đang kiểm tra…" : "Kiểm tra & lưu"}
          </Button>
          {state ? (
            <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>{state.message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
