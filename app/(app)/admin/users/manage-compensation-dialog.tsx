"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatVnd } from "@/lib/money";
import { bpsToPercent } from "@/lib/payroll";
import { addCompensation, updateCompensation, deleteCompensation } from "./compensation-actions";
import type { CompRow, UserRow } from "./types";

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Shared editable field grid for add & edit (pre-fills from `c` when editing). */
function CompFields({ c }: { c?: CompRow }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="grid gap-1">
        <Label>Loại</Label>
        <select name="kind" defaultValue={c?.kind ?? "HOURLY"} className={selectClass}>
          <option value="HOURLY">Theo giờ</option>
          <option value="FIXED">Cố định/tháng</option>
        </select>
      </div>
      <div className="grid gap-1">
        <Label>Lương cố định (VND/tháng)</Label>
        <Input name="fixedMonthlySalary" type="number" min={0} defaultValue={c?.fixedMonthlySalary ?? 0} />
      </div>
      <div className="grid gap-1">
        <Label>Từ ngày</Label>
        <Input name="effectiveFrom" type="date" defaultValue={c?.effectiveFrom ?? ""} required />
      </div>
      <div className="grid gap-1">
        <Label>Đến ngày (trống = hiện hành)</Label>
        <Input name="effectiveTo" type="date" defaultValue={c?.effectiveTo ?? ""} />
      </div>
      <div className="grid gap-1">
        <Label>Đơn giá vốn (VND/giờ)</Label>
        <Input name="costRate" type="number" min={0} defaultValue={c?.costRate ?? 0} />
      </div>
      <div className="grid gap-1">
        <Label>Đơn giá bán (VND/giờ)</Label>
        <Input name="billableRate" type="number" min={0} defaultValue={c?.billableRate ?? 0} />
      </div>
      <div className="grid gap-1">
        <Label>% thuế TNCN</Label>
        <Input
          name="taxWithholdingPercent"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={c ? bpsToPercent(c.taxWithholdingRateBps) : 0}
        />
      </div>
      <div className="grid gap-1">
        <Label>% BH công ty</Label>
        <Input
          name="employerCostPercent"
          type="number"
          min={0}
          max={100}
          step="0.01"
          defaultValue={c ? bpsToPercent(c.employerCostRateBps) : 0}
        />
      </div>
    </div>
  );
}

function CompPeriodRow({ userId, c }: { userId: string; c: CompRow }) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <tr className="border-t bg-muted/20">
        <td colSpan={6} className="p-3">
          <form action={updateCompensation} onSubmit={() => setEditing(false)} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="userId" value={userId} />
            <CompFields c={c} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Huỷ
              </Button>
              <SubmitButton size="sm">Lưu</SubmitButton>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t">
      <td className="px-2 py-1.5">{c.kind === "FIXED" ? "Cố định" : "Theo giờ"}</td>
      <td className="px-2 py-1.5">{c.effectiveFrom}</td>
      <td className="px-2 py-1.5">{c.effectiveTo ?? "nay"}</td>
      <td className="px-2 py-1.5 text-right">
        {c.kind === "FIXED"
          ? `${formatVnd(c.fixedMonthlySalary)}/th`
          : `${formatVnd(c.costRate)}/${formatVnd(c.billableRate)} /giờ`}
      </td>
      <td className="px-2 py-1.5 text-right text-muted-foreground">{bpsToPercent(c.taxWithholdingRateBps)}%</td>
      <td className="px-2 py-1.5 text-right whitespace-nowrap">
        <button type="button" onClick={() => setEditing(true)} className="cursor-pointer hover:underline">
          Sửa
        </button>
        <form action={deleteCompensation} className="inline">
          <input type="hidden" name="id" value={c.id} />
          <button type="submit" className="ml-3 cursor-pointer text-destructive hover:underline">
            Xoá
          </button>
        </form>
      </td>
    </tr>
  );
}

export function ManageCompensationDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lịch sử lương — {user.name}</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Loại</th>
                <th className="px-2 py-1.5 text-left font-medium">Từ</th>
                <th className="px-2 py-1.5 text-left font-medium">Đến</th>
                <th className="px-2 py-1.5 text-right font-medium">Mức</th>
                <th className="px-2 py-1.5 text-right font-medium">Thuế</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {user.compensations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">
                    Chưa có giai đoạn lương.
                  </td>
                </tr>
              ) : (
                user.compensations.map((c) => <CompPeriodRow key={c.id} userId={user.id} c={c} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Add a new period */}
        <form action={addCompensation} className="flex flex-col gap-3 rounded-md border p-3">
          <div className="text-sm font-medium">Thêm giai đoạn</div>
          <input type="hidden" name="userId" value={user.id} />
          <CompFields />
          <p className="text-xs text-muted-foreground">
            Để trống &quot;Đến ngày&quot; → giai đoạn hiện hành (tự đóng giai đoạn mở trước đó). Loại &quot;Theo
            giờ&quot; dùng đơn giá; &quot;Cố định&quot; dùng lương cố định.
          </p>
          <div className="flex justify-end">
            <SubmitButton>Thêm giai đoạn</SubmitButton>
          </div>
        </form>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
