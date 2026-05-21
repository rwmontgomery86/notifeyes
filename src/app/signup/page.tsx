import Link from "next/link";
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
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
  );
}
