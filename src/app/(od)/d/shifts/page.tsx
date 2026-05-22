import { eq, sql, and } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { optometrists, practices, shifts, watchZones } from "@/db/schema";
import { formatShiftWhen, relativeTime } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";
import { ShiftsMap } from "./ShiftsMap";
import { ScopeToggle } from "./ScopeToggle";

export const metadata = { title: "Browse shifts · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function OdShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ wz?: string }>;
}) {
  const session = await auth();
  const odId = session!.user.odId!;
  const sp = await searchParams;
  const watchZoneOnly = sp.wz === "1";

  const [me] = await db
    .select()
    .from(optometrists)
    .where(eq(optometrists.id, odId))
    .limit(1);

  const isVerified = me?.verificationStatus === "verified" && !!me?.verifiedAt;
  const licenseState = me?.licenseState ?? null;

  const [{ count: watchZoneCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(watchZones)
    .where(and(eq(watchZones.odId, odId), eq(watchZones.paused, false)));

  // Open shifts with practice lat/lng for the map. Sorted by distance from
  // OD home if we have one. State-mandatory; watch-zone narrow opt-in.
  const rows = licenseState
    ? await db
        .select({
          shift: shifts,
          practice: practices,
          lat: sql<number | null>`ST_Y(${practices.location}::geometry)`.as("lat"),
          lng: sql<number | null>`ST_X(${practices.location}::geometry)`.as("lng"),
          distanceMeters: me?.homeLocation
            ? sql<number>`COALESCE(ST_Distance(${practices.location}, ${optometrists.homeLocation}), 0)`.as(
                "distance_meters",
              )
            : sql<number>`0`.as("distance_meters"),
        })
        .from(shifts)
        .innerJoin(practices, eq(shifts.practiceId, practices.id))
        .innerJoin(optometrists, eq(optometrists.id, odId))
        .where(
          and(
            eq(shifts.status, "posted"),
            sql`${shifts.startsAt} > now()`,
            eq(practices.state, licenseState),
            watchZoneOnly
              ? sql`EXISTS (
                  SELECT 1 FROM watch_zones wz
                  WHERE wz.od_id = ${odId}
                    AND wz.paused = false
                    AND ST_Contains(wz.geometry::geometry, ${practices.location}::geometry)
                )`
              : sql`TRUE`,
          ),
        )
        .orderBy(sql`distance_meters asc, ${shifts.startsAt} asc`)
        .limit(50)
    : [];

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

  const headerCopy = !licenseState
    ? "Add your license state on your profile to see matching shifts."
    : watchZoneOnly
      ? "Showing shifts inside your watch zones."
      : `Showing shifts in ${licenseState}. Toggle to narrow to your watch zones.`;

  return (
    <div>
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Open shifts</h1>
          <p className="mt-1 text-muted-foreground">
            {headerCopy}{" "}
            <Link href="/d/watch" className="font-medium text-primary">
              {watchZoneCount === 0 ? "Set a watch zone" : "Manage watch zones"}
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScopeToggle licenseState={licenseState} />
          {isVerified ? (
            <span className="ne-pill border-green-500/40 bg-green-100/60 text-green-900">
              Verified
            </span>
          ) : (
            <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900">
              Verification pending
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="ne-card p-0 overflow-hidden h-[520px]">
          <ShiftsMap pins={pins} home={homeForMap} />
        </div>

        <div className="grid gap-3 overflow-y-auto max-h-[520px] pr-1">
          {!licenseState ? (
            <div className="ne-card text-sm text-muted-foreground">
              No license state on file.{" "}
              <Link href="/d/profile" className="font-medium text-primary">
                Add it on your profile
              </Link>{" "}
              to see open shifts.
            </div>
          ) : rows.length === 0 ? (
            watchZoneOnly && watchZoneCount === 0 ? (
              <div className="ne-card text-sm text-muted-foreground">
                You don&apos;t have any active watch zones.{" "}
                <Link href="/d/watch" className="font-medium text-primary">
                  Create one
                </Link>{" "}
                to filter by area.
              </div>
            ) : (
              <div className="ne-card text-sm text-muted-foreground">
                No open shifts {watchZoneOnly ? "inside your watch zones" : `in ${licenseState}`} right now.
              </div>
            )
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
