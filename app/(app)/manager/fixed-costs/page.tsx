import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatISODate } from "@/lib/period";
import { formatVnd } from "@/lib/money";
import { nowSaigon } from "@/lib/clock";
import { FixedCostsTable } from "./fixed-costs-table";
import type { FixedCostRow } from "./fixed-costs-table";

export const dynamic = "force-dynamic";

export default async function FixedCostsPage() {
  await requireManager();
  const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { effectiveFrom: "desc" } });
  const todayStr = nowSaigon().toISOString().slice(0, 10);

  const rows: FixedCostRow[] = fixedCosts.map((f) => {
    const from = formatISODate(f.effectiveFrom);
    const to = f.effectiveTo ? formatISODate(f.effectiveTo) : null;
    // Đang áp dụng khi hôm nay nằm trong [từ, đến] (so sánh chuỗi ISO YYYY-MM-DD là an toàn).
    const active = from <= todayStr && (to === null || to >= todayStr);
    return { id: f.id, name: f.name, category: f.category, monthlyAmount: f.monthlyAmount, effectiveFrom: from, effectiveTo: to, active };
  });

  const activeRows = rows.filter((r) => r.active);
  const activeTotal = activeRows.reduce((s, r) => s + r.monthlyAmount, 0);
  const categories = [...new Set(fixedCosts.map((f) => f.category))].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi phí cố định</h1>
      <FixedCostsTable data={rows} categories={categories} />
      {activeRows.length > 0 ? (
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>Tổng/tháng (đang áp dụng — {activeRows.length} khoản)</span>
          <span>{formatVnd(activeTotal)}</span>
        </div>
      ) : null}
    </div>
  );
}
