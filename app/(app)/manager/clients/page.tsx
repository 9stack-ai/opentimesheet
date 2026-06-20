import Link from "next/link";
import { prisma } from "@/lib/db";
import { createClient } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Khách hàng</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thêm khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClient} className="flex flex-wrap items-end gap-2">
            <Input name="name" placeholder="Tên khách hàng" required className="w-48" />
            <Input name="contact" placeholder="Liên hệ (tuỳ chọn)" className="w-40" />
            <Input name="notes" placeholder="Ghi chú (tuỳ chọn)" className="w-48" />
            <Button type="submit">Thêm</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">Chưa có khách hàng nào.</p>
          ) : (
            <ul className="divide-y">
              {clients.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-6 py-3">
                  <Link
                    href={`/manager/clients/${c.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {c._count.projects} dự án
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
