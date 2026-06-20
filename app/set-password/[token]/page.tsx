import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            9s
          </div>
          <h1 className="text-xl font-semibold">9stimesheet</h1>
          <p className="text-sm text-muted-foreground">Chấm công &amp; quản lý chi phí nội bộ</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Đặt mật khẩu</CardTitle>
            <CardDescription>Tạo mật khẩu mới cho tài khoản của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <SetPasswordForm linkToken={token} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
