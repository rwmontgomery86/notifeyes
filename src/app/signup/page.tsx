import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SignupChoice } from "./SignupChoice";
import { PracticeSignupForm } from "./PracticeSignupForm";
import { OdSignupForm } from "./OdSignupForm";

export const metadata = { title: "Sign up · NotifEyes" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Image
          src="/notifeyes-logo.png"
          alt="NotifEyes"
          width={140}
          height={140}
          priority
          className="mx-auto mb-6 h-32 w-32 object-contain"
        />
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm text-ink-2 hover:text-ink">
            ← Back
          </Link>
          <Link href="/login" className="text-sm text-ink-2 hover:text-ink">
            Already have an account? Log in
          </Link>
        </div>

        {!role ? (
          <SignupChoice />
        ) : role === "practice" ? (
          <PracticeSignupForm />
        ) : (
          <OdSignupForm />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
