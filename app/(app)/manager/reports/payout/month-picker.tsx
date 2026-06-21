"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Pick any calendar month → navigates to ?month=YYYY-MM (clears the week param). */
export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; // native month input → "YYYY-MM"
    if (/^\d{4}-\d{2}$/.test(v)) router.push(`/manager/reports/payout?month=${v}`);
  }

  return (
    <input
      type="month"
      value={value}
      onChange={onChange}
      className={inputClass}
      aria-label="Chọn tháng"
    />
  );
}
