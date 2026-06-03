/**
 * Minimal RFC 5545 iCalendar (.ics) generation for shift calendar invites.
 *
 * Client-safe (pure functions, no server-only imports) so it can be used from
 * server actions, workers, and — if ever needed — the client.
 *
 * Scope is deliberately small: a single all-details VEVENT. We don't fold long
 * lines (>75 octets); modern calendar clients tolerate unfolded lines and our
 * values stay short.
 */

export interface IcsEvent {
  /** Globally-unique, stable id (e.g. `booking-<id>@notifeyes.com`). */
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  url?: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format a Date as a UTC iCal timestamp: YYYYMMDDTHHMMSSZ. */
function toIcsUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape a TEXT value per RFC 5545 §3.3.11. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Build a ready-to-attach .ics for a booked shift. The return shape matches
 * `EmailAttachment` (notifications/types) without importing it, keeping this
 * module domain-light. `content` is raw text; the email channel base64-encodes.
 */
export function shiftIcsAttachment(input: {
  bookingId: string;
  practiceName: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}): { filename: string; content: string; contentType: string } {
  const ics = buildIcs({
    uid: `booking-${input.bookingId}@notifeyes.com`,
    title: `Optometry shift · ${input.practiceName}`,
    start: input.start,
    end: input.end,
    location: input.location,
    description: `Your booked shift at ${input.practiceName}. Manage it on NotifEyes.`,
    url: input.url,
  });
  return { filename: "shift.ics", content: ics, contentType: "text/calendar" };
}

export function buildIcs(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NotifEyes//Shift//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(event.uid)}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(event.start)}`,
    `DTEND:${toIcsUtc(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.description)
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.url) lines.push(`URL:${escapeText(event.url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  // iCal lines are CRLF-delimited; trailing CRLF terminates the file.
  return lines.join("\r\n") + "\r\n";
}
