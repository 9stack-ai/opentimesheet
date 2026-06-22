import type { Period } from "@/lib/period";
import { approvedEntriesForPeriod } from "@/lib/reporting-db";
import { payoutByUser } from "@/lib/reporting";

export type UserPayroll = {
  gross: number; // lương gộp (trước thuế) trong kỳ
  tax: number; // thuế TNCN giữ lại
  net: number; // thực nhận = gross − tax
};

/**
 * Per-user accrued payroll for the period (Map userId → {gross, tax, net}), purely from APPROVED
 * timesheet. The rate of each entry was snapshotted at approval using the compensation period
 * effective on its date — so compensation history only supplies the rate ("hệ số"), it never
 * generates pay on its own. People on a fixed salary log no timesheet, so they don't accrue here;
 * their pay is reconciled against the actual disbursements (thực chi) recorded for them.
 */
export async function payrollByUser(period: Period): Promise<Map<string, UserPayroll>> {
  const entries = await approvedEntriesForPeriod(period);
  const map = new Map<string, UserPayroll>();
  for (const r of payoutByUser(entries)) {
    map.set(r.userId, { gross: r.gross, tax: r.taxWithheld, net: r.net });
  }
  return map;
}
