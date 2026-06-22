import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction } from "@/lib/auth-actions";
import { ChangePasswordForm } from "./settings/password/change-password-form";

/** Full-screen gate shown by the app layout when a user must change their password
 *  (e.g. after an admin reset). No sidebar/nav — the app is blocked until they change it. */
export function ForcedPasswordChange({ name }: { name: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Đổi mật khẩu để tiếp tục</CardTitle>
          <CardDescription>
            Xin chào {name}. Tài khoản đang dùng mật khẩu tạm — vui lòng đặt mật khẩu mới trước khi
            sử dụng. (Mật khẩu hiện tại là mật khẩu tạm bạn được cấp.)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChangePasswordForm />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              Đăng xuất
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
