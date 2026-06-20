import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateClient, deleteClient } from "../actions";
import { createProject } from "@/app/manager/projects/actions";

export const dynamic = "force-dynamic";

const inputClass = "rounded border border-gray-300 px-3 py-2 text-sm";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: "asc" } },
      _count: { select: { projects: true } },
    },
  });
  if (!client) notFound();

  return (
    <section className="flex flex-col gap-6">
      <Link href="/manager/clients" className="text-sm text-blue-700 underline">
        ← Clients
      </Link>
      <h1 className="text-xl font-semibold">{client.name}</h1>

      <form
        action={updateClient}
        className="flex flex-wrap items-end gap-2 rounded border border-gray-200 p-4"
      >
        <input type="hidden" name="id" value={client.id} />
        <input name="name" defaultValue={client.name} className={inputClass} />
        <input name="contact" defaultValue={client.contact ?? ""} placeholder="Contact" className={inputClass} />
        <input name="notes" defaultValue={client.notes ?? ""} placeholder="Notes" className={inputClass} />
        <button type="submit" className="rounded border border-gray-300 px-3 py-2 text-sm">
          Save
        </button>
      </form>

      <div>
        <h2 className="mb-2 font-medium">Projects</h2>
        <form action={createProject} className="mb-3 flex gap-2">
          <input type="hidden" name="clientId" value={client.id} />
          <input name="name" placeholder="New project name" required className={inputClass} />
          <button type="submit" className="rounded bg-black px-3 py-2 text-sm text-white">
            Add project
          </button>
        </form>
        <ul className="divide-y divide-gray-100">
          {client.projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <Link href={`/manager/projects/${p.id}`} className="text-blue-700 underline">
                {p.name}
              </Link>
              <span className="text-sm text-gray-500">{p.status}</span>
            </li>
          ))}
          {client.projects.length === 0 ? (
            <li className="py-2 text-gray-500">No projects yet.</li>
          ) : null}
        </ul>
      </div>

      {client._count.projects === 0 ? (
        <form action={deleteClient}>
          <input type="hidden" name="id" value={client.id} />
          <button type="submit" className="rounded border border-red-300 px-3 py-2 text-sm text-red-700">
            Delete client
          </button>
        </form>
      ) : null}
    </section>
  );
}
