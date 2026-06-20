// Pure profitability engine — the correctness-critical core. No DB import.
// Monthly: fixed costs allocated across projects by approved hours (largest-remainder
// so Σ allocated == totalFixed exactly). Weekly: gross margin only (no fixed allocation).
// All money is integer VND.

export type ProjectInput = {
  projectId: string;
  projectName: string;
  approvedHours: number;
  revenue: number; // Σ hours × billableRateSnapshot (rounded)
  directCost: number; // Σ hours × costRateSnapshot (rounded) + project-tagged expenses
};

export type ProfitabilityInput = {
  projects: ProjectInput[];
  totalFixed: number; // company fixed costs for the period
  companyExpenses: number; // null-project (company-level) expenses for the period
};

export type ProjectProfit = ProjectInput & {
  allocatedFixed: number; // 0 when not allocating (weekly)
  net: number; // revenue − directCost − allocatedFixed
};

export type CompanyProfit = {
  revenue: number;
  directCost: number;
  totalFixed: number; // 0 when not allocating (weekly)
  companyExpenses: number;
  net: number; // revenue − directCost − totalFixed − companyExpenses
};

export type Profitability = {
  perProject: ProjectProfit[];
  company: CompanyProfit;
};

/** Allocate totalFixed across projects by approved hours, distributing the rounding
 *  remainder to the largest fractional shares so Σ allocated == totalFixed exactly. */
function allocateFixedByHours(projects: ProjectInput[], totalFixed: number): Map<string, number> {
  const result = new Map<string, number>();
  const companyHours = projects.reduce((s, p) => s + p.approvedHours, 0);

  if (companyHours <= 0 || totalFixed <= 0) {
    for (const p of projects) result.set(p.projectId, 0);
    return result; // fixed costs stay as unallocated company overhead
  }

  const shares = projects.map((p) => {
    const exact = (p.approvedHours / companyHours) * totalFixed;
    const floor = Math.floor(exact);
    return { projectId: p.projectId, alloc: floor, remainder: exact - floor };
  });

  let leftover = totalFixed - shares.reduce((s, x) => s + x.alloc, 0);
  for (const s of [...shares].sort((a, b) => b.remainder - a.remainder)) {
    if (leftover <= 0) break;
    s.alloc += 1;
    leftover -= 1;
  }

  for (const s of shares) result.set(s.projectId, s.alloc);
  return result;
}

export function computeProfitability(
  input: ProfitabilityInput,
  allocateFixed = true,
): Profitability {
  const alloc = allocateFixed
    ? allocateFixedByHours(input.projects, input.totalFixed)
    : new Map<string, number>();

  const perProject: ProjectProfit[] = input.projects.map((p) => {
    const allocatedFixed = allocateFixed ? (alloc.get(p.projectId) ?? 0) : 0;
    return { ...p, allocatedFixed, net: p.revenue - p.directCost - allocatedFixed };
  });

  const revenue = input.projects.reduce((s, p) => s + p.revenue, 0);
  const directCost = input.projects.reduce((s, p) => s + p.directCost, 0);
  const totalFixed = allocateFixed ? input.totalFixed : 0;

  return {
    perProject,
    company: {
      revenue,
      directCost,
      totalFixed,
      companyExpenses: input.companyExpenses,
      net: revenue - directCost - totalFixed - input.companyExpenses,
    },
  };
}
