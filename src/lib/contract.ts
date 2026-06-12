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

export const CONTRACT_TEMPLATE_VERSION = "v0.2-stub";

export function buildContractBody(params: {
  practiceName: string;
  odName: string;
  shiftStartsAt: Date;
  shiftEndsAt: Date;
  ratePerHour: string; // formatted, e.g. "$110.00"
  wageAmount: string; // formatted estimated wage the practice pays the OD directly
  matchFee: string; // formatted, e.g. "$10.00"
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
    `2. PAYMENT. The Practice pays the Optometrist's wage — estimated at ${params.wageAmount} for the scheduled hours — directly to the Optometrist. NotifEyes never holds or transmits the wage. Separately, NotifEyes charges the Practice a flat ${params.matchFee} match fee, authorized when this booking is confirmed and captured only after the Practice confirms the Optometrist worked the shift. If the Optometrist does not show, the match fee is not charged.`,
    ``,
    `3. CANCELLATION. Cancelling carries no platform fee. Cancellations and no-shows are recorded on the cancelling party's reliability record as described in the NotifEyes Terms of Service; the closer to the shift start, the more serious the record.`,
    ``,
    `4. CONDUCT. The Optometrist will hold a current, unrestricted license to practice optometry in the state where the Practice operates. The Practice will provide a safe and adequately equipped work environment.`,
    ``,
    `5. DISPUTES. Disputes are resolved per the NotifEyes Terms of Service. NotifEyes is not a party to this agreement and serves only as the platform.`,
    ``,
    `By clicking "I agree", both parties acknowledge they have read this engagement and agree to its terms.`,
  ].join("\n");
}
