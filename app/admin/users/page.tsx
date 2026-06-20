import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { InviteForm } from "./invite-form";
import { updateUser, setUserStatus } from "./actions";

export const dynamic = "force-dynamic"; // auth + DB per request

const cellInput = "rounded border border-gray-300 px-2 py-1 text-sm";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">User administration</h1>

      <InviteForm />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Edit (role &amp; rates)</th>
              <th className="py-2 pr-3">Account</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-gray-600">{u.email}</div>
                </td>
                <td className="py-2 pr-3">{u.status}</td>
                <td className="py-2 pr-3">
                  <form action={updateUser} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="name" defaultValue={u.name} className={cellInput} aria-label="Name" />
                    <select name="role" defaultValue={u.role} className={cellInput} aria-label="Role">
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <input
                      name="defaultCostRate"
                      type="number"
                      min={0}
                      defaultValue={u.defaultCostRate}
                      className={`${cellInput} w-28`}
                      aria-label="Cost rate"
                    />
                    <input
                      name="defaultBillableRate"
                      type="number"
                      min={0}
                      defaultValue={u.defaultBillableRate}
                      className={`${cellInput} w-28`}
                      aria-label="Billable rate"
                    />
                    <button type="submit" className="rounded border border-gray-300 px-2 py-1">
                      Save
                    </button>
                  </form>
                </td>
                <td className="py-2 pr-3">
                  <form action={setUserStatus}>
                    <input type="hidden" name="id" value={u.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={u.status === "DISABLED" ? "ACTIVE" : "DISABLED"}
                    />
                    <button type="submit" className="rounded border border-gray-300 px-2 py-1">
                      {u.status === "DISABLED" ? "Enable" : "Disable"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
