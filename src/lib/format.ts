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

// Public marketing prices. Keep in sync with NOTIFEYES_MATCH_FEE_CENTS /
// NOTIFEYES_SAMEDAY_FEE_CENTS in env.ts — these are the strings shown to
// unauthenticated visitors on /pricing, /for-practices, and /.
// --TODO: legal review --- final amounts.
export const MARKETING_MATCH_FEE_DISPLAY = "$9.99";
export const MARKETING_SAMEDAY_DISPLAY = "$19.99";
