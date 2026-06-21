import { ExpensesView } from "./expenses-view";
import type { PeriodSearchParams } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<PeriodSearchParams>;
}) {
  return (
    <ExpensesView
      kind="REGULAR"
      title="Chi phí"
      basePath="/manager/expenses"
      searchParams={await searchParams}
    />
  );
}
