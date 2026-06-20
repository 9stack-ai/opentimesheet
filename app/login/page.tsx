import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">9stimesheet</h1>
      {set ? (
        <p className="text-sm text-green-700">Password set. Please sign in.</p>
      ) : null}
      <LoginForm />
    </main>
  );
}
