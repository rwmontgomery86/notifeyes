import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { practices, shifts } from "@/db/schema";
import { ShiftForm } from "../../new/ShiftForm";
import { isUuid } from "@/lib/uuid";

export const metadata = { title: "Edit draft · NotifEyes" };
export const dynamic = "force-dynamic";

function toLocalDate(d: Date) {
  // YYYY-MM-DD in local time so the <input type="date"> shows the same day
  // the practice scheduled, regardless of UTC offset.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTime(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default async function EditShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user.practiceId) redirect("/p/dashboard");
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [row] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, id))
    .limit(1);

  if (!row) redirect("/p/shifts");
  if (
    row.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    redirect("/p/shifts");
  }
  // Drafts only — anything else falls back to the read-only view.
  if (row.status !== "draft") redirect(`/p/shifts/${id}`);

  const [practice] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, session.user.practiceId))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Edit draft</h1>
      <p className="mt-1 text-muted-foreground">
        Tweak the details, then save as a draft or post it to alert matching ODs.
      </p>
      <ShiftForm
        practiceCity={practice?.city ?? null}
        mode="edit"
        shiftId={id}
        initial={{
          date: toLocalDate(row.startsAt),
          startTime: toLocalTime(row.startsAt),
          endTime: toLocalTime(row.endsAt),
          lunchMinutes: row.lunchMinutes,
          // The form covers the V1 subset; default to fill_in if the row
          // somehow has a v2 type (recurring/permanent) we don't support yet.
          type:
            row.type === "half_day" || row.type === "weekend"
              ? row.type
              : "fill_in",
          ratePerHour: Math.round(row.rateCentsPerHour / 100),
          notesForOd: row.notesForOd ?? "",
        }}
      />
    </div>
  );
}
