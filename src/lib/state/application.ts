/**
 * Application state machine. Mirrors §4 of the brief, with one liberalization
 * for product reality: a practice can book an applicant directly without
 * going through shortlist/offer (e.g. "I see this OD, I trust them, book").
 * The book confirm page is the implicit offer-and-accept handshake.
 *
 *   applied ─┬─→ shortlisted ─→ offered ─→ accepted → (creates Booking)
 *            │          │           │
 *            │      declined    declined
 *            ├─────────────────→ accepted     (direct book — practice books
 *            │                                 an 'applied' OD without
 *            │                                 shortlisting/offering)
 *            ↓
 *         withdrawn / declined
 *
 * Invite path: Practice creates with source='invite' starting at 'offered',
 * OD accepts → 'accepted'.
 */

import type { applicationStatusEnum } from "@/db/schema";

export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["shortlisted", "offered", "accepted", "withdrawn", "declined"],
  shortlisted: ["offered", "accepted", "declined", "withdrawn"],
  offered: ["accepted", "declined", "withdrawn"],
  accepted: [], // terminal
  declined: [], // terminal
  withdrawn: [], // terminal
};

export function canTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (!canTransitionApplication(from, to)) {
    throw new Error(`Invalid application transition: ${from} → ${to}`);
  }
}
