import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { LoginForm } from "./LoginForm";
import { env } from "@/env";

export const metadata = { title: "Log in · NotifEyes" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; reset?: string }>;
}) {
  const { callbackUrl, error, reset } = await searchParams;
  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Image
            src="/notifeyes-logo.png"
            alt="NotifEyes"
            width={140}
            height={140}
            priority
            className="mx-auto h-32 w-32 object-contain"
          />
          <div className="ne-card mt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Welcome back.
          </h1>
          <p className="mt-1 text-sm text-ink-2">Log in to NotifEyes.</p>
          {error ? (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Invalid email or password.
            </div>
          ) : null}
          {reset ? (
            <div className="mt-4 rounded-md border border-green-500/40 bg-green-50/40 px-3 py-2 text-sm text-green-900">
              Password updated. Log in with your new password.
            </div>
          ) : null}
          <LoginForm callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
          <p className="mt-6 text-sm text-ink-2">
            New here?{" "}
            <Link href="/signup" className="font-medium text-rust hover:text-rust-2">
              Create an account
            </Link>
          </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
