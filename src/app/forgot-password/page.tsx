import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = { title: "Forgot password · NotifEyes" };

export default function ForgotPasswordPage() {
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
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              Enter your account email and we&apos;ll send you a link to reset it.
            </p>
            <ForgotPasswordForm />
            <p className="mt-6 text-sm text-ink-2">
              Remembered it?{" "}
              <Link href="/login" className="font-medium text-rust hover:text-rust-2">
                Back to log in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
