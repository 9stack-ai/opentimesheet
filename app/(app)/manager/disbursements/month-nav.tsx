"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Month picker for the disbursements (thực chi) page → navigates to ?month=YYYY-MM. */
export function MonthNav({ value }: { value: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (/^\d{4}-\d{2}$/.test(v)) router.push(`/manager/disbursements?month=${v}`);
      }}
      className={inputClass}
      aria-label="Chọn kỳ lương"
    />
  );
}
