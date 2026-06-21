"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { roleLabel } from "@/lib/labels";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type UserOption = { id: string; name: string; role: string };

/** ADMIN-only dropdown to view/edit another user's timesheet. Preserves the current period params. */
export function UserPicker({ users, value }: { users: UserOption[]; value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("userId", e.target.value);
    router.push(`/timesheet?${params.toString()}`);
  }

  return (
    <select value={value} onChange={onChange} className={selectClass} aria-label="Chọn người dùng">
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} ({roleLabel(u.role)})
        </option>
      ))}
    </select>
  );
}
