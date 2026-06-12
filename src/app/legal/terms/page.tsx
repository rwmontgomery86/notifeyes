import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSection,
  LegalTodo,
} from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — NotifEyes",
  description: "Plain-English Terms of Service draft. Final version pending legal review.",
};

const SECTIONS: [string, string][] = [
  ["1. Acceptance", "By creating an account on NotifEyes, you agree to these Terms. If you don't agree, don't use NotifEyes."],
  ["2. The marketplace", "NotifEyes is a venue connecting practices with optometrists. We are not a party to the engagement between them."],
  ["3. Eligibility", "Practices must be lawfully operating in the US. ODs must hold a current state license."],
  ["4. Verification", "We verify license, ID, and (optionally) DEA. We do not guarantee performance — but we vet that ODs are who they say they are."],
  ["5. Fees", "$10 per booked shift on the practice side (same-day and urgent included). ODs are free. Subject to V2 changes — V1 cohort price is locked."],
  ["6. Cancellation", "No platform cancellation fee. Cancellations and no-shows are recorded on the cancelling party's reliability record — see Trust & safety."],
  ["7. Payment", "The practice pays the OD's wage directly; NotifEyes never holds or transmits it. The $10 match fee is held at booking and captured only after the practice confirms attendance. Each party is responsible for its own tax reporting."],
  ["8. Conduct", "No harassment, no off-platform circumvention, no PHI uploaded. Suspension for violations."],
  ["9. Disputes", "Internal review within 2 business days. Binding arbitration thereafter — see § 14."],
  ["10. Liability", "NotifEyes is not liable for clinical outcomes, equipment damage, or wage disputes between parties."],
  ["11. IP", "You retain your content. We get a license to display it on the platform."],
  ["12. Termination", "Either party may terminate. Open bookings continue to completion."],
  ["13. Changes", "We may update Terms. We will email 30 days before material changes take effect."],
  ["14. Arbitration · governing law", "Delaware. JAMS rules. Class action waiver."],
];

export default function TermsPage() {
  return (
    <LegalLayout
      active="terms"
      title="Terms of Service."
      intro="Plain-English terms draft. Final version pending legal review. The headings below are the structure we will publish."
    >
      <LegalTodo />
      {SECTIONS.map(([h, body]) => (
        <LegalSection key={h} heading={h} body={body} />
      ))}
    </LegalLayout>
  );
}
