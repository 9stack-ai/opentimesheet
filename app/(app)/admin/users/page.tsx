import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { roleLabel } from "@/lib/labels";
import { UserStatusBadge } from "@/components/status-badge";
import { InviteForm } from "./invite-form";
import { updateUser, setUserStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic"; // auth + DB per request

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Quản trị người dùng</h1>

      <InviteForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Sửa (vai trò &amp; đơn giá)</TableHead>
                  <TableHead>Tài khoản</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell>
                      <form action={updateUser} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <Input
                          name="name"
                          defaultValue={u.name}
                          className="h-8 w-32 text-sm"
                          aria-label="Tên"
                        />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className={selectClass}
                          aria-label="Vai trò"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="defaultCostRate"
                          type="number"
                          min={0}
                          defaultValue={u.defaultCostRate}
                          className="h-8 w-28 text-sm"
                          aria-label="Đơn giá vốn"
                          placeholder="Đơn giá vốn"
                        />
                        <Input
                          name="defaultBillableRate"
                          type="number"
                          min={0}
                          defaultValue={u.defaultBillableRate}
                          className="h-8 w-28 text-sm"
                          aria-label="Đơn giá bán"
                          placeholder="Đơn giá bán"
                        />
                        <Button type="submit" variant="outline" size="sm">
                          Lưu
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={setUserStatus}>
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={u.status === "DISABLED" ? "ACTIVE" : "DISABLED"}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {u.status === "DISABLED" ? "Kích hoạt" : "Vô hiệu"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
