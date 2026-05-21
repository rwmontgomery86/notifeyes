/**
 * Application state machine. Mirrors §4 of the brief.
 *
 *   applied → shortlisted → offered → accepted → (creates Booking)
 *      ↓          ↓           ↓
 *   withdrawn  declined    declined
 *
 * Invite path: Practice creates with source='invite' starting at 'offered'.
 */

import type { applicationStatusEnum } from "@/db/schema";

export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["shortlisted", "offered", "withdrawn", "declined"],
  shortlisted: ["offered", "declined", "withdrawn"],
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
