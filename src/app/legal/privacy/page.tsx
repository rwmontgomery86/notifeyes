import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  LegalLayout,
  LegalSection,
  LegalTodo,
} from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — NotifEyes",
  description: "Plain-English Privacy Policy draft. Final version pending legal review.",
};

const SECTIONS: [string, ReactNode][] = [
  [
    "1. Who we are",
    "NotifEyes is operated by Second Sight Technologies LLC. This notice explains what we collect, how we use it, and who we share it with. We do not collect or store patient protected health information (PHI).",
  ],
  [
    "2. What we collect",
    "Account and contact details (name, email, and — only if you provide it — your phone number); professional credentials for optometrists (license state, number, and expiry, NPI, and any documents you upload such as license, DEA, CPR, or malpractice proof); location data (a practice's address and an optometrist's home ZIP and the watch zones you draw on the map); payment identifiers (a Stripe customer reference — your card details are entered with and held by Stripe, never by us); your profile, messages, bookings, and notification preferences; and standard usage and device data.",
  ],
  [
    "3. How we use it",
    "To match optometrists to shifts, verify licenses, send the notifications you opt into (in-app, email, and SMS), authorize and capture the $10 match fee through Stripe, provide support, keep the service secure, and make NotifEyes better. We do not use your data for third-party advertising.",
  ],
  [
    "4. SMS / text messaging",
    <>
      <span className="block">
        We collect your phone number and SMS consent only when you affirmatively
        opt in to receive text messages from NotifEyes. We use your phone number
        and SMS consent only to send transactional and account-related NotifEyes
        messages, including watch-zone shift matches, shift opportunities,
        application updates, shift confirmations, shift reminders, no-show
        checks, account updates, and platform notifications.
      </span>
      <span className="mt-4 block">
        Message frequency varies. <strong>Message and data rates may apply.</strong>{" "}
        You may reply <strong>STOP</strong> to unsubscribe at any time or{" "}
        <strong>HELP</strong> for help. You may also manage SMS notification
        preferences in your account settings. Consent to receive SMS messages is
        not a condition of purchase or use of the NotifEyes platform.
      </span>
      <span className="mt-4 block">
        NotifEyes does not sell, rent, or share mobile phone numbers or SMS
        opt-in consent with third parties or affiliates for their marketing or
        promotional purposes. We share SMS-related information only with service
        providers that help operate NotifEyes, such as Twilio, solely to deliver
        the messages requested by the user.
      </span>
    </>,
  ],
  [
    "5. Who we share with",
    "Only the counterparty on a booking (so a practice and optometrist can coordinate), and the service providers we use to run NotifEyes: Twilio (SMS), Resend (email), Stripe (payments), Mapbox (maps and geocoding), UploadThing (file uploads), Supabase (database hosting), Vercel (application hosting), Sentry (error monitoring), PostHog (product analytics), and Google (if you sign in with Google). Each receives only what it needs to provide its service — none of them receive your data for marketing. We also disclose information where legally required.",
  ],
  [
    "6. Cookies",
    "Session, preferences, and analytics cookies. See our Cookie policy and adjust them in Cookie preferences.",
  ],
  [
    "7. Retention",
    "Account data: for the lifetime of your account plus up to 7 years for tax and audit purposes. Messages: 3 years. You can ask us to delete your data sooner where the law allows.",
  ],
  [
    "8. Your rights",
    "Access, correction, deletion, and portability. Email support@notifeyes.com and we'll help.",
  ],
  [
    "9. Security",
    "Data is encrypted in transit and at rest. Card data is handled by Stripe under its PCI compliance — we never store full card numbers. We follow least-privilege access internally.",
  ],
  ["10. Children", "NotifEyes is not for anyone under 18. Optometrists must be licensed adults."],
  ["11. International", "V1 is US-only. Future markets will be covered in addenda."],
  ["12. Changes", "We will email you at least 30 days before any material change takes effect."],
  ["13. Contact", "Questions about your privacy? Email support@notifeyes.com."],
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      active="privacy"
      title="Privacy Policy."
      intro="Plain-English privacy notice draft. Final version pending legal review. The headings below are the structure we will publish."
      lastUpdated="June 2026"
      version="v1.1"
    >
      <LegalTodo />
      {SECTIONS.map(([h, body]) => (
        <LegalSection key={h} heading={h} body={body} />
      ))}
    </LegalLayout>
  );
}
