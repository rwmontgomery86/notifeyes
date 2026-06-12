import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSection,
  LegalTodo,
} from "@/components/marketing/LegalLayout";
import { BETA_AGREEMENT_VERSION } from "@/lib/beta-agreement";

export const metadata: Metadata = {
  title: "Beta Participant Agreement — NotifEyes",
  description:
    "The closed-beta participant agreement accepted at signup. NotifEyes is in beta; features, fees, and policies may change.",
};

const SECTIONS: [string, string][] = [
  ["1. What this is", "NotifEyes is in a closed, invite-only beta. This agreement supplements the Terms of Service for everyone who holds an account during the beta period; where the two conflict, this agreement controls until the beta ends."],
  ["2. How you accept", "You accept by checking the agreement box when you create your account. We record the version you accepted and the timestamp on your account."],
  ["3. The product will change", "Features, screens, fees, policies, and data structures may change at any time, without notice, while we are in beta. We will try to communicate material changes by email, but we do not promise to."],
  ["4. No recourse for pre-exit changes", "You have no claim or recourse arising from changes made to the product, its fees, or its policies before the beta ends. If a change isn't acceptable to you, your remedy is to stop using NotifEyes and close your account."],
  ["5. Fees during beta", "The standard $10 match fee may be reduced or waived for beta participants at our discretion. Practices always pay the optometrist's wage directly — NotifEyes never holds or transmits wages. Any fee change applies to future bookings only; a booked shift keeps the fee it was booked with."],
  ["6. Availability and data", "There is no uptime guarantee during beta. The service may be interrupted, and we may modify or migrate stored data as the product evolves. Ask support if you want a copy of your data."],
  ["7. Feedback", "We may use any feedback, bug report, or suggestion you give us to improve the product, without compensation or attribution."],
  ["8. Leaving the beta", "You can stop participating at any time; we can end your participation or the beta itself at any time. Bookings already in flight continue to completion under the terms they were made with."],
  ["9. Support", "Questions and problems go to support@notifeyes.com. During beta we aim to respond within 48 hours."],
];

export default function BetaAgreementPage() {
  return (
    <LegalLayout
      active="beta-agreement"
      title="Beta Participant Agreement."
      intro="NotifEyes is in closed beta. This is the agreement you accept when you create an account during the beta period."
      lastUpdated="June 2026"
      version={BETA_AGREEMENT_VERSION}
    >
      <LegalTodo />
      {SECTIONS.map(([h, body]) => (
        <LegalSection key={h} heading={h} body={body} />
      ))}
    </LegalLayout>
  );
}
