// Client-safe. Route params flow into uuid-typed Postgres columns; a malformed
// value makes the cast throw (22P02) and the page 500. Validate first and 404.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
