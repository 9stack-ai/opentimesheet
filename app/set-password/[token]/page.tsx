import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Set your password</h1>
      <SetPasswordForm linkToken={token} />
    </main>
  );
}
