/**
 * Client-safe address formatting. No server-only imports — usable from both
 * server actions / workers (booking emails, calendar invites) and client
 * components.
 */

export interface AddressParts {
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

/** One-line address, e.g. "123 Market St, San Francisco, CA 94103". */
export function formatAddress(parts: AddressParts): string {
  const cityState = [parts.city, parts.state].filter(Boolean).join(", ");
  const tail = [cityState, parts.zip].filter(Boolean).join(" ");
  return [parts.addressLine, tail].filter(Boolean).join(", ").trim();
}
