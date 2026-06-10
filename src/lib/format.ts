/**
 * Pure formatting helpers, safe to import from client components.
 *
 * Do NOT add any imports that reach `env.ts` or any server-only secret —
 * anything imported here ships to the browser.
 */

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// Public marketing price. Keep in sync with NOTIFEYES_MATCH_FEE_CENTS in
// env.ts — this is the string shown to unauthenticated visitors on /pricing,
// /for-practices, and /. Flat $10, same-day and urgent included.
// --TODO: legal review --- final amount.
export const MARKETING_MATCH_FEE_DISPLAY = "$10";
