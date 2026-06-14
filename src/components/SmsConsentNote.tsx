import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared SMS / transactional-consent disclaimer shown next to every SMS opt-in
 * toggle (OD profile, practice settings). Centralized so the consent language
 * stays in lockstep with the SMS terms published at /legal/terms — Twilio A2P
 * requires the message-rates + STOP/HELP disclosure wherever consent is
 * collected, not just in the Terms.
 *
 * `about` is the form-specific phrase describing what the alerts cover; pass
 * any form-specific note (e.g. how marketing opt-in differs) as children.
 */
export function SmsConsentNote({
  about,
  children,
}: {
  about: string;
  children?: ReactNode;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      We use your phone and email only to notify you about {about} and to send
      transactional account messages.
      {children ? <> {children}</> : null} We do not sell or share your contact
      information with third parties for marketing. Message frequency varies;
      standard message and data rates may apply for SMS. Reply STOP to cancel,
      HELP for help. See our{" "}
      <Link href="/legal/terms" className="underline">
        Terms
      </Link>
      .
    </p>
  );
}
