import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatISODate } from "@/lib/period";
import { FixedCostsTable } from "./fixed-costs-table";
import type { FixedCostRow } from "./fixed-costs-table";

export const dynamic = "force-dynamic";

export default async function FixedCostsPage() {
  await requireManager();
  const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { effectiveFrom: "desc" } });

  const rows: FixedCostRow[] = fixedCosts.map((f) => ({
    id: f.id,
    name: f.name,
    category: f.category,
    monthlyAmount: f.monthlyAmount,
    effectiveFrom: formatISODate(f.effectiveFrom),
    effectiveTo: f.effectiveTo ? formatISODate(f.effectiveTo) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chi phí cố định</h1>
      <FixedCostsTable data={rows} />
    </div>
  );
}
