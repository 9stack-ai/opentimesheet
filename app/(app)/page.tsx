import Link from "next/link";
import { Building2, CheckSquare, Clock, TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { atLeastManager } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const isManager = atLeastManager(user.role);
  const isAdmin = user.role === "ADMIN";

  const cards = [
    { href: "/timesheet", title: "Chấm công", desc: "Ghi giờ làm và gửi duyệt", icon: Clock, show: true },
    { href: "/manager/approvals", title: "Duyệt công", desc: "Duyệt giờ công cộng tác viên", icon: CheckSquare, show: isManager },
    { href: "/manager/clients", title: "Khách hàng & dự án", desc: "Quản lý khách hàng, dự án, đơn giá", icon: Building2, show: isManager },
    { href: "/manager/reports/payout", title: "Chi trả CTV", desc: "Tổng tiền phải trả theo kỳ", icon: Wallet, show: isManager },
    { href: "/manager/reports/profitability", title: "Lợi nhuận", desc: "Doanh thu, chi phí và lãi/lỗ", icon: TrendingUp, show: isManager },
    { href: "/admin/users", title: "Người dùng", desc: "Mời và phân quyền người dùng", icon: Users, show: isAdmin },
  ].filter((c) => c.show);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Xin chào, {user.name} 👋</h1>
        <p className="text-muted-foreground">Bạn đang đăng nhập với vai trò {roleLabel(user.role)}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="block">
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
                <CardHeader>
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                  </div>
                  <CardDescription>{c.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
