"use client";

import { useActionState } from "react";
import { inviteUser, type InviteResult } from "./actions";
import { ROLES } from "@/lib/roles";

const inputClass = "rounded border border-gray-300 px-3 py-2";

export function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteUser,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-gray-200 p-4">
      <h2 className="font-medium">Invite a user</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Full name" required className={inputClass} />
        <input name="email" type="email" placeholder="Email" required className={inputClass} />
        <select name="role" defaultValue="FREELANCER" className={inputClass}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          name="defaultCostRate"
          type="number"
          min={0}
          placeholder="Cost rate (VND/hr)"
          className={inputClass}
        />
        <input
          name="defaultBillableRate"
          type="number"
          min={0}
          placeholder="Billable rate (VND/hr)"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Inviting…" : "Invite"}
      </button>
      {state ? (
        state.ok ? (
          <div className="text-sm text-green-700">
            {state.message} Invite link (share manually):{" "}
            <code className="break-all rounded bg-gray-100 px-1">{state.inviteLink}</code>
          </div>
        ) : (
          <p className="text-sm text-red-600">{state.message}</p>
        )
      ) : null}
    </form>
  );
}
