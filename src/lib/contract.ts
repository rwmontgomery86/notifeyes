/**
 * Click-through contract template for V1.
 *
 * Locked decision: no DocuSign — both parties click "I agree" inline, we
 * timestamp it on the Contract row, and we freeze the body text at the moment
 * of agreement so future template edits don't retroactively change what
 * either party agreed to.
 *
 * The body text below uses placeholders only — final legal language is a
 * --TODO: legal review item before any real launch.
 */

export const CONTRACT_TEMPLATE_VERSION = "v0.1-stub";

export function buildContractBody(params: {
  practiceName: string;
  odName: string;
  shiftStartsAt: Date;
  shiftEndsAt: Date;
  ratePerHour: string; // formatted, e.g. "$110.00"
  totalAmount: string;
  matchFee: string; // formatted, e.g. "$9.99" or "$19.99 (same-day)"
}): string {
  // --TODO: legal review --- all language below is placeholder. Replace with
  // attorney-drafted independent contractor agreement before any real launch.
  return [
    `NOTIFEYES SHIFT ENGAGEMENT — Independent Contractor Agreement (template ${CONTRACT_TEMPLATE_VERSION})`,
    ``,
    `This engagement is between ${params.practiceName} ("Practice") and ${params.odName} ("Optometrist") for a single fill-in shift on ${params.shiftStartsAt.toLocaleString()} ending ${params.shiftEndsAt.toLocaleString()}.`,
    ``,
    `1. SCOPE. The Optometrist will provide independent optometric services at the Practice during the scheduled shift hours at the agreed rate of ${params.ratePerHour}/hour. The Optometrist is an independent contractor and not an employee of the Practice or NotifEyes.`,
    ``,
    `2. PAYMENT. Practice will be charged ${params.totalAmount}, which includes a NotifEyes match fee of ${params.matchFee}. The Optometrist's payout is scheduled three (3) days after shift completion.`,
    ``,
    `3. CANCELLATION. The cancellation fee schedule and no-show policy described in the NotifEyes Terms of Service apply to this engagement.`,
    ``,
    `4. CONDUCT. The Optometrist will hold a current, unrestricted license to practice optometry in the state where the Practice operates. The Practice will provide a safe and adequately equipped work environment.`,
    ``,
    `5. DISPUTES. Disputes are resolved per the NotifEyes Terms of Service. NotifEyes is not a party to this agreement and serves only as the platform.`,
    ``,
    `By clicking "I agree", both parties acknowledge they have read this engagement and agree to its terms.`,
  ].join("\n");
}
