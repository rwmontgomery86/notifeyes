import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import {
  bookings,
  optometrists,
  practices,
  reviews,
  shifts,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatShiftWhen } from "@/lib/dates";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPromptPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [row] = await db
    .select({
      booking: bookings,
      shift: shifts,
      od: optometrists,
      practice: practices,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) notFound();

  const isMyPractice =
    session.user.practiceId &&
    session.user.practiceId === row.booking.practiceId;
  const isMyOd =
    session.user.odId && session.user.odId === row.booking.odId;
  if (!isMyPractice && !isMyOd) redirect("/");
  if (row.booking.status !== "completed") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="ne-card">
          <h1 className="text-xl font-bold">Reviews open once the shift is complete.</h1>
          <p className="mt-1 text-muted-foreground">
            Current booking status: {row.booking.status}.
          </p>
          <Link href={`/bookings/${bookingId}`} className="mt-4 inline-block text-primary">
            ← Back to booking
          </Link>
        </div>
      </div>
    );
  }

  const authorRole = isMyPractice ? "practice" : "od";
  const [existing] = await db
    .select()
    .from(reviews)
    .where(
      and(eq(reviews.bookingId, bookingId), eq(reviews.authorRole, authorRole)),
    )
    .limit(1);

  if (existing && existing.publishedAt) {
    return (
      <ReviewAlreadyDone
        booking={row}
        existing={existing}
        authorRole={authorRole}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href={`/bookings/${bookingId}`} className="text-sm text-muted-foreground">
        ← Back to booking
      </Link>
      <h1 className="mt-4 text-2xl font-bold">
        How was {authorRole === "practice" ? row.od.name : row.practice.name}?
      </h1>
      <p className="mt-1 text-muted-foreground">
        {formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} ·{" "}
        {row.practice.city}, {row.practice.state}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Reviews stay blind for 7 days or until the counterparty also submits.
        You can&apos;t edit once you publish.
      </p>

      <ReviewForm
        bookingId={bookingId}
        authorRole={authorRole}
        existing={existing ?? null}
      />
    </div>
  );
}

function ReviewAlreadyDone({
  booking,
  existing,
  authorRole,
}: {
  booking: {
    booking: typeof bookings.$inferSelect;
    shift: typeof shifts.$inferSelect;
    od: typeof optometrists.$inferSelect;
    practice: typeof practices.$inferSelect;
  };
  existing: typeof reviews.$inferSelect;
  authorRole: "practice" | "od";
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href={`/bookings/${booking.booking.id}`} className="text-sm text-muted-foreground">
        ← Back to booking
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Thanks — your review is in.</h1>
      <p className="mt-2 text-muted-foreground">
        Published on {existing.publishedAt?.toLocaleDateString()}.
      </p>
      <div className="mt-4 ne-card text-sm">
        <div className="font-medium">{existing.ratingOverall} ★</div>
        {existing.publicComment ? (
          <p className="mt-2 whitespace-pre-wrap">{existing.publicComment}</p>
        ) : null}
      </div>
    </div>
  );
}
