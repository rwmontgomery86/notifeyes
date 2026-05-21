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
