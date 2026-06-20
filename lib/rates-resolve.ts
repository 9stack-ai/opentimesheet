import { prisma } from "@/lib/db";
import { effectiveRates, type EffectiveRates } from "@/lib/rates";

/** Resolve the effective cost & billable rate for a user on a project (override ?? default). */
export async function resolveRatesForUserProject(
  userId: string,
  projectId: string,
): Promise<EffectiveRates> {
  const [user, assignment] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { defaultCostRate: true, defaultBillableRate: true },
    }),
    prisma.assignment.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { costRateOverride: true, billableRateOverride: true },
    }),
  ]);
  return effectiveRates(assignment, user);
}
