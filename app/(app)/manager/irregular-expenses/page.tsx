import { ExpensesView } from "../expenses/expenses-view";

export const dynamic = "force-dynamic";

export default function IrregularExpensesPage() {
  return <ExpensesView kind="IRREGULAR" title="Chi bất thường" />;
}
