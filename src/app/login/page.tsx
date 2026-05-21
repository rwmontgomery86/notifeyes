import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · NotifEyes" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl place-items-center px-6 py-12">
      <div className="w-full max-w-md ne-card">
        <h1 className="text-2xl font-bold">Welcome back.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log in to NotifEyes.
        </p>
        {error ? (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Invalid email or password.
          </div>
        ) : null}
        <LoginForm callbackUrl={callbackUrl} />
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
