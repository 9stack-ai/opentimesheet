"use client";

import { useActionState } from "react";
import { setPassword } from "../actions";

export function SetPasswordForm({ linkToken }: { linkToken: string }) {
  const [state, formAction, pending] = useActionState(setPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="linkToken" value={linkToken} />
      <label className="flex flex-col gap-1 text-sm">
        New password (min 8 characters)
        <input
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      {state && !state.ok ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
