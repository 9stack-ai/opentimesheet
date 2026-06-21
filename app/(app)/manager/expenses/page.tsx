import { ExpensesView } from "./expenses-view";

export const dynamic = "force-dynamic";

export default function ExpensesPage() {
  return <ExpensesView kind="REGULAR" title="Chi phí" />;
}
