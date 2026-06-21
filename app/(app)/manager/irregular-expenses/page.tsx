import { ExpensesView } from "../expenses/expenses-view";
import type { PeriodSearchParams } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function IrregularExpensesPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  return (
    <ExpensesView
      kind="IRREGULAR"
      title="Chi bất thường"
      basePath="/manager/irregular-expenses"
      searchParams={await searchParams}
    />
  );
}
