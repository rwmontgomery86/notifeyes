import { eq, sql, and } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, practices, shifts } from "@/db/schema";
import { formatShiftWhen, relativeTime } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";
import { ShiftsMap } from "./ShiftsMap";

export const metadata = { title: "Browse shifts · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function OdShiftsPage() {
  const session = await auth();
  const odId = session!.user.odId!;

  const [me] = await db
    .select()
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);

  const isVerified = me?.verificationStatus === "verified" && !!me?.verifiedAt;

  // Open shifts with practice lat/lng for the map. Sorted by distance from
  // OD home if we have one.
  const rows = await db
    .select({
      shift: shifts,
      practice: practices,
      lat: sql<number | null>`ST_Y(${practices.location}::geometry)`.as("lat"),
      lng: sql<number | null>`ST_X(${practices.location}::geometry)`.as("lng"),
      distanceMeters: me?.homeLocation
        ? sql<number>`COALESCE(ST_Distance(${practices.location}, ${optometrists.homeLocation}), 0)`.as("distance_meters")
        : sql<number>`0`.as("distance_meters"),
    })
    .from(shifts)
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .innerJoin(optometrists, eq(optometrists.id, odId))
    .where(and(eq(shifts.status, "posted"), sql`${shifts.startsAt} > now()`))
    .orderBy(sql`distance_meters asc, ${shifts.startsAt} asc`)
    .limit(50);

  // Also pull the OD home location for the "me" pin
  const homeRow = me?.homeLocation
    ? await db.execute<{ lat: number; lng: number }>(sql`
        SELECT ST_Y(home_location::geometry)::float AS lat,
               ST_X(home_location::geometry)::float AS lng
        FROM optometrists WHERE id = ${odId} LIMIT 1
      `)
    : null;
  const home = homeRow?.rows[0] ?? null;

  const pins = rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.shift.id,
      // pg can return double precision as a string in some driver configs —
      // coerce to ensure Leaflet gets numbers.
      lat: Number(r.lat),
      lng: Number(r.lng),
      label: r.practice.name,
      rateCents: r.shift.rateCentsPerHour,
      city: `${r.practice.city ?? ""}, ${r.practice.state ?? ""}`,
      whenLabel: formatShiftWhen(r.shift.startsAt, r.shift.endsAt),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const homeForMap =
    home && Number.isFinite(Number(home.lat)) && Number.isFinite(Number(home.lng))
      ? { lat: Number(home.lat), lng: Number(home.lng) }
      : null;

  return (
    <div>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Open shifts</h1>
          <p className="mt-1 text-muted-foreground">
            Sorted by distance from your home location.{" "}
            <Link href="/d/watch" className="font-medium text-primary">
              Set a watch zone
            </Link>{" "}
            to get pinged when new ones post.
          </p>
        </div>
        {isVerified ? (
          <span className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
            Verified
          </span>
        ) : (
          <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900">
            Verification pending
          </span>
        )}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="ne-card p-0 overflow-hidden h-[520px]">
          <ShiftsMap
            pins={pins}
            home={homeForMap}
          />
        </div>

        <div className="grid gap-3 overflow-y-auto max-h-[520px] pr-1">
          {rows.length === 0 ? (
            <div className="ne-card text-sm text-muted-foreground">
              No open shifts right now. Set a watch zone and we&apos;ll alert
              you when one matches.
            </div>
          ) : null}
          {rows.map(({ shift, practice, distanceMeters }) => (
            <Link
              key={shift.id}
              href={`/shifts/${shift.id}`}
              className="ne-card hover:border-primary transition-colors"
              data-shift-id={shift.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{practice.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {practice.city}, {practice.state}
                    {distanceMeters > 0
                      ? ` · ${(distanceMeters / 1609.34).toFixed(1)} mi away`
                      : ""}
                  </div>
                  <div className="mt-2 text-sm">
                    {formatShiftWhen(shift.startsAt, shift.endsAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {relativeTime(shift.startsAt)} · {shift.lunchMinutes} min lunch
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatUsd(shift.rateCentsPerHour)}
                    <span className="text-xs font-medium text-muted-foreground">
                      /hr
                    </span>
                  </div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground capitalize">
                    {shift.type.replace("_", " ")}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
