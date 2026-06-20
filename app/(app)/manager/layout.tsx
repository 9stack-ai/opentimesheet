import type { ReactNode } from "react";
import { requireManager } from "@/lib/rbac";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  await requireManager();
  return <>{children}</>;
}
