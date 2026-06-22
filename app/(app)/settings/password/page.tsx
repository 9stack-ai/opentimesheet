import { requireUser } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Đổi mật khẩu</h1>
        <p className="text-muted-foreground">Đổi mật khẩu đăng nhập của bạn. Cần nhập đúng mật khẩu hiện tại.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
