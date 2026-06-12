import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { findValidReset } from "@/lib/password-reset";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Reset password · NotifEyes" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await findValidReset(token);

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
            {valid ? (
              <>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  Choose a new password.
                </h1>
                <p className="mt-1 text-sm text-ink-2">
                  At least 8 characters. You&apos;ll log in with it right after.
                </p>
                <ResetPasswordForm token={token} />
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  This link has expired.
                </h1>
                <p className="mt-1 text-sm text-ink-2">
                  Reset links are single-use and expire after 1 hour. Request a
                  fresh one and try again.
                </p>
                <Link href="/forgot-password" className="ne-btn mt-6 w-full">
                  Request a new link
                </Link>
                <p className="mt-6 text-sm text-ink-2">
                  Remembered your password?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-rust hover:text-rust-2"
                  >
                    Back to log in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
