import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalLayout,
  LegalSection,
  LegalTodo,
} from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie policy — NotifEyes",
  description: "How NotifEyes uses cookies and similar storage. Draft pending legal review.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      active="cookies"
      title="Cookie policy."
      intro="A short, plain-English breakdown of how NotifEyes uses cookies and local storage. The detailed treatment lives in §4 of our Privacy Policy."
    >
      <LegalTodo />

      <LegalSection
        heading="1. What cookies we set"
        body="Three categories: session (keeps you logged in), preferences (theme, watch-zone view, message read state), and analytics (which pages, how long, anonymized)."
      />
      <LegalSection
        heading="2. Third-party"
        body="Stripe sets cookies on payment surfaces (required for fraud detection). Our authentication library sets a CSRF token. We do not run third-party ad networks."
      />
      <LegalSection
        heading="3. Controlling cookies"
        body="Your browser settings control everything we can set. We don't override them. The 'Cookie preferences' control inside your account toggles analytics off without affecting session."
      />
      <LegalSection
        heading="4. Do Not Track"
        body="If your browser sends a DNT header, we honor it for analytics. Session and preferences still work — that's required for the product to function."
      />
      <LegalSection
        heading="5. More detail"
        body="See §4 of our Privacy Policy for the full data-retention story. Contact privacy@notifeyes.com for specifics."
      />

      <p className="mt-8 text-sm text-ink-3">
        Cross-reference:{" "}
        <Link href="/legal/privacy#4-cookies" className="text-rust hover:text-rust-2">
          Privacy Policy §4
        </Link>
      </p>
    </LegalLayout>
  );
}
