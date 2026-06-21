import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="9stimesheet" width={48} height={48} className="mx-auto mb-2 size-12" />
          <h1 className="text-xl font-semibold">9stimesheet</h1>
          <p className="text-sm text-muted-foreground">Chấm công &amp; quản lý chi phí nội bộ</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập</CardTitle>
            <CardDescription>Nhập email và mật khẩu để tiếp tục.</CardDescription>
          </CardHeader>
          <CardContent>
            {set ? (
              <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Đặt mật khẩu thành công. Vui lòng đăng nhập.
              </p>
            ) : null}
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
