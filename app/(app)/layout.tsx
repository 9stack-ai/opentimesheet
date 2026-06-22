import type { ReactNode } from "react";
import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ForcedPasswordChange } from "./forced-password-change";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  // Force a password change (e.g. after admin reset) before any app screen is usable.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mustChangePassword: true },
  });
  if (dbUser?.mustChangePassword) {
    return <ForcedPasswordChange name={user.name ?? "bạn"} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: user.name ?? "Người dùng", role: user.role }} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
