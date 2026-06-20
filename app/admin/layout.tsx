import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { signOut } from "@/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold">
            9stimesheet
          </Link>
          <Link href="/admin/users">Users</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">
            {user.name} ({user.role})
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="rounded border border-gray-300 px-2 py-1">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
