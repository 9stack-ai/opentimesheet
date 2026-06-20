import { prisma } from "@/lib/db";
import { requireManager } from "@/lib/rbac";
import { formatVnd } from "@/lib/money";
import { formatISODate } from "@/lib/period";
import { createFixedCost, deleteFixedCost } from "./actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-2 py-1 text-sm";

export default async function FixedCostsPage() {
  await requireManager();
  const fixedCosts = await prisma.fixedCost.findMany({ orderBy: { effectiveFrom: "desc" } });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Fixed costs</h1>

      <form action={createFixedCost} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4">
        <input name="name" placeholder="Name" required className={inputClass} />
        <input name="category" placeholder="Category" required className={inputClass} />
        <input
          name="monthlyAmount"
          type="number"
          min={0}
          placeholder="Monthly (VND)"
          required
          className={inputClass}
        />
        <label className="flex flex-col text-xs text-gray-500">
          From
          <input name="effectiveFrom" type="date" required className={inputClass} />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          To (optional)
          <input name="effectiveTo" type="date" className={inputClass} />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          Add fixed cost
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Monthly</th>
            <th className="py-2 pr-3">From</th>
            <th className="py-2 pr-3">To</th>
            <th className="py-2 pr-3" />
          </tr>
        </thead>
        <tbody>
          {fixedCosts.map((f) => (
            <tr key={f.id} className="border-b border-gray-100">
              <td className="py-2 pr-3">{f.name}</td>
              <td className="py-2 pr-3">{f.category}</td>
              <td className="py-2 pr-3">{formatVnd(f.monthlyAmount)}</td>
              <td className="py-2 pr-3">{formatISODate(f.effectiveFrom)}</td>
              <td className="py-2 pr-3">{f.effectiveTo ? formatISODate(f.effectiveTo) : "—"}</td>
              <td className="py-2 pr-3">
                <form action={deleteFixedCost}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="text-red-700">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {fixedCosts.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-2 text-gray-500">
                No fixed costs.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
