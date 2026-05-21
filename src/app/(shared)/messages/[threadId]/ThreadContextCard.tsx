import Link from "next/link";

export function ThreadContextCard({
  bookingId,
  shiftId,
  practiceName,
  practiceId,
  odName,
  odId,
}: {
  bookingId: string | null;
  shiftId: string | null;
  practiceName: string | null;
  practiceId: string | null;
  odName: string | null;
  odId: string | null;
}) {
  return (
    <aside className="ne-card">
      <h2 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
        Context
      </h2>
      <div className="mt-3 grid gap-2 text-sm">
        {bookingId ? (
          <Link href={`/bookings/${bookingId}`} className="text-primary font-medium">
            Booking details →
          </Link>
        ) : null}
        {shiftId ? (
          <Link href={`/shifts/${shiftId}`} className="text-primary font-medium">
            View shift →
          </Link>
        ) : null}
        {practiceId && practiceName ? (
          <Link href={`/practices/${practiceId}`} className="text-foreground">
            <span className="text-muted-foreground text-xs">Practice</span>
            <div className="font-medium">{practiceName}</div>
          </Link>
        ) : null}
        {odId && odName ? (
          <Link href={`/ods/${odId}`} className="text-foreground">
            <span className="text-muted-foreground text-xs">OD</span>
            <div className="font-medium">{odName}</div>
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
