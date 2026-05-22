import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSection,
  LegalTodo,
} from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — NotifEyes",
  description: "Plain-English Privacy Policy draft. Final version pending legal review.",
};

const SECTIONS: [string, string][] = [
  ["1. What we collect", "Account info, license + ID for verification, shift activity, messages, payments. No patient PHI."],
  ["2. How we use it", "To match you, verify you, pay you, support you, and to make NotifEyes better."],
  ["3. Sharing", "Only with the counterparty on a booking, our verification partners, Stripe for payments, and where legally required."],
  ["4. Cookies", "Session, preferences, analytics. Settable in Cookie preferences."],
  ["5. Retention", "Account data: lifetime of account + 7 years for tax / audit. Messages: 3 years."],
  ["6. Your rights", "Access, correction, deletion, portability. Email privacy@notifeyes.com."],
  ["7. Security", "Encrypted at rest + in transit. PCI inherited via Stripe. SOC2 path planned."],
  ["8. Children", "Not for under-18. ODs must be licensed."],
  ["9. International", "V1 is US-only. Future markets covered in addenda."],
  ["10. Changes", "We will email 30 days before material changes."],
  ["11. Contact", "privacy@notifeyes.com · DPO mailing address on file."],
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      active="privacy"
      title="Privacy Policy."
      intro="Plain-English privacy notice draft. Final version pending legal review. The headings below are the structure we will publish."
    >
      <LegalTodo />
      {SECTIONS.map(([h, body]) => (
        <LegalSection key={h} heading={h} body={body} />
      ))}
    </LegalLayout>
  );
}
