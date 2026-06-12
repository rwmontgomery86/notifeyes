/**
 * Closed-beta participant agreement metadata. Client-safe (no server-only
 * imports) — the version renders on /legal/beta-agreement and is recorded on
 * the user row at signup via the required click-through checkbox.
 *
 * Bump the version when the agreement text changes materially; each signup
 * records the version it accepted (users.betaAgreementVersion).
 */
export const BETA_AGREEMENT_VERSION = "v1.0-beta";
