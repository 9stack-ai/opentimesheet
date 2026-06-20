import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { signOut } from "@/auth";

export const dynamic = "force-dynamic"; // auth per request

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">9stimesheet</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="rounded border border-gray-300 px-3 py-1 text-sm">
            Sign out
          </button>
        </form>
      </div>

      <p className="text-gray-600">
        Signed in as <span className="font-medium">{user.name}</span> ({user.role})
      </p>

      <nav className="flex flex-col gap-2">
        {user.role === "ADMIN" ? (
          <Link href="/admin/users" className="text-blue-700 underline">
            User administration
          </Link>
        ) : null}
        {user.role === "ADMIN" || user.role === "MANAGER" ? (
          <Link href="/manager/clients" className="text-blue-700 underline">
            Clients &amp; projects
          </Link>
        ) : null}
        <Link href="/timesheet" className="text-blue-700 underline">
          My timesheet
        </Link>
      </nav>
    </main>
  );
}
