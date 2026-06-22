import { requireUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { formatISODate } from "@/lib/period";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RedmineConnectForm } from "./redmine-connect-form";
import { disconnectRedmine } from "./actions";

export const dynamic = "force-dynamic";

export default async function RedmineSettingsPage() {
  const user = await requireUser();
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { redmineUserId: true, redmineConnectedAt: true },
  });
  const connected = !!u?.redmineUserId;
  const redmineUrl = process.env.REDMINE_URL ?? null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Kết nối Redmine</h1>
        <p className="text-muted-foreground">
          Liên kết tài khoản Redmine của bạn để đồng bộ task được giao và đẩy giờ đã duyệt.
        </p>
      </div>

      {!redmineUrl ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            Quản trị viên chưa cấu hình <code>REDMINE_URL</code>. Liên hệ admin để bật tích hợp Redmine.
          </CardContent>
        </Card>
      ) : connected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đã kết nối</CardTitle>
            <CardDescription>{redmineUrl}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Redmine user #{u!.redmineUserId}
              {u!.redmineConnectedAt ? ` · từ ${formatISODate(u!.redmineConnectedAt)}` : ""}
            </span>
            <form action={disconnectRedmine}>
              <SubmitButton variant="outline">Ngắt kết nối</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : (
        <RedmineConnectForm redmineUrl={redmineUrl} />
      )}
    </div>
  );
}
