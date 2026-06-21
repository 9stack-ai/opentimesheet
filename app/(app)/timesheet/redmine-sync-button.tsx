"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncRedmine, type SyncResult } from "./redmine-sync-action";

export function RedmineSyncButton() {
  const [state, formAction, pending] = useActionState<SyncResult | undefined, FormData>(
    syncRedmine,
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Đang đồng bộ…" : "Đồng bộ Redmine"}
      </Button>
    </form>
  );
}
