import Link from "next/link";
import { prisma } from "@/lib/db";
import { createClient } from "./actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-3 py-2 text-sm";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Clients</h1>

      <form
        action={createClient}
        className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4"
      >
        <input name="name" placeholder="Client name" required className={inputClass} />
        <input name="contact" placeholder="Contact (optional)" className={inputClass} />
        <input name="notes" placeholder="Notes (optional)" className={inputClass} />
        <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
          Add client
        </button>
      </form>

      <ul className="divide-y divide-gray-100">
        {clients.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <Link href={`/manager/clients/${c.id}`} className="text-blue-700 underline">
              {c.name}
            </Link>
            <span className="text-sm text-gray-500">{c._count.projects} project(s)</span>
          </li>
        ))}
        {clients.length === 0 ? <li className="py-2 text-gray-500">No clients yet.</li> : null}
      </ul>
    </section>
  );
}
