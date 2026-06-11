"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, watchZones } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";
import { geocoder } from "@/lib/geocode";
import { hasAnyNotificationChannel } from "@/lib/notifications/optIn";

const circleSchema = z.object({
  kind: z.literal("circle"),
  centerLat: z.number().gte(-90).lte(90),
  centerLng: z.number().gte(-180).lte(180),
  radiusMeters: z.number().positive().max(200_000), // 200km cap
});
const polygonSchema = z.object({
  kind: z.literal("polygon"),
  points: z
    .array(
      z.object({
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
      }),
    )
    .min(3)
    .max(200),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  minRateCents: z.number().int().min(0).max(1_000_000),
  geometryMeta: z.union([circleSchema, polygonSchema]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
  shiftTypes: z
    .array(z.enum(["fill_in", "half_day", "weekend", "recurring", "permanent"]))
    .min(1)
    .optional(),
  notifyChannels: z.array(z.enum(["push", "email", "sms"])).min(1).optional(),
});

// Build the queryable PostGIS geometry from the UI's draw params. For circles,
// we approximate with ST_Buffer of a point in meters (geography) and convert
// back for storage. Shared by create + update so the branches live in one place.
function geometrySql(meta: z.infer<typeof createSchema>["geometryMeta"]) {
  if (meta.kind === "circle") {
    return sql`ST_Buffer(
      ST_SetSRID(ST_MakePoint(${meta.centerLng}, ${meta.centerLat}), 4326)::geography,
      ${meta.radiusMeters}
    )::geometry::geography`;
  }
  const ringWkt =
    "POLYGON((" +
    [
      ...meta.points.map((p) => `${p.lng} ${p.lat}`),
      // close the ring
      `${meta.points[0]!.lng} ${meta.points[0]!.lat}`,
    ].join(", ") +
    "))";
  return sql`ST_SetSRID(ST_GeomFromText(${ringWkt}), 4326)::geography`;
}

// A zone that can't notify anyone is useless — both create and update require
// at least one enabled channel. Returns the error message, or null when ok.
async function notificationChannelGate(userId: string): Promise<string | null> {
  const [u] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
      marketingOptedIn: users.marketingOptedIn,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !hasAnyNotificationChannel(u)) {
    return "Enable at least one notification channel in your profile before creating a watch zone.";
  }
  return null;
}

export async function createWatchZone(input: z.infer<typeof createSchema>) {
  const session = await requireOd();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const odId = session.user.odId!;

  const gateError = await notificationChannelGate(session.user.id);
  if (gateError) return { ok: false as const, error: gateError };

  const daysOfWeek = v.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
  const shiftTypes = v.shiftTypes ?? ["fill_in", "half_day", "weekend"];
  const notifyChannels = v.notifyChannels ?? ["push", "email"];

  await db.execute(sql`
    INSERT INTO watch_zones (od_id, name, shape, geometry, geometry_meta, min_rate_cents, days_of_week, shift_types, notify_channels)
    VALUES (
      ${odId},
      ${v.name},
      ${v.geometryMeta.kind}::watch_zone_shape,
      ${geometrySql(v.geometryMeta)},
      ${JSON.stringify(v.geometryMeta)}::jsonb,
      ${v.minRateCents},
      ${JSON.stringify(daysOfWeek)}::jsonb,
      ${JSON.stringify(shiftTypes)}::jsonb,
      ${JSON.stringify(notifyChannels)}::jsonb
    );
  `);

  return { ok: true as const };
}

export async function updateWatchZone(
  zoneId: string,
  input: z.infer<typeof createSchema>,
) {
  const session = await requireOd();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const odId = session.user.odId!;

  const [existing] = await db
    .select({ id: watchZones.id })
    .from(watchZones)
    .where(and(eq(watchZones.id, zoneId), eq(watchZones.odId, odId)))
    .limit(1);
  if (!existing) {
    return { ok: false as const, error: "Zone not found" };
  }

  const gateError = await notificationChannelGate(session.user.id);
  if (gateError) return { ok: false as const, error: gateError };

  const daysOfWeek = v.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
  const shiftTypes = v.shiftTypes ?? ["fill_in", "half_day", "weekend"];
  const notifyChannels = v.notifyChannels ?? ["push", "email"];

  // `paused` is deliberately untouched — editing a paused zone keeps it paused.
  await db.execute(sql`
    UPDATE watch_zones SET
      name = ${v.name},
      shape = ${v.geometryMeta.kind}::watch_zone_shape,
      geometry = ${geometrySql(v.geometryMeta)},
      geometry_meta = ${JSON.stringify(v.geometryMeta)}::jsonb,
      min_rate_cents = ${v.minRateCents},
      days_of_week = ${JSON.stringify(daysOfWeek)}::jsonb,
      shift_types = ${JSON.stringify(shiftTypes)}::jsonb,
      notify_channels = ${JSON.stringify(notifyChannels)}::jsonb
    WHERE id = ${zoneId} AND od_id = ${odId};
  `);

  return { ok: true as const };
}

// One-tap activation: a preset circle covering the SF Bay launch metro (SF, the
// Peninsula, the East Bay, and San Jose). Delegates to createWatchZone so the
// opt-in gate + insert logic stay in one place. Bay Area is hardcoded because
// the beta launch metro is pinned to SF Bay (env.NOTIFEYES_LAUNCH_METRO).
export async function createBayAreaWatchZone() {
  return createWatchZone({
    name: "Bay Area",
    minRateCents: 0,
    geometryMeta: {
      kind: "circle",
      centerLat: 37.66,
      centerLng: -122.15,
      radiusMeters: 60_000,
    },
  });
}

export async function deleteWatchZone(zoneId: string) {
  const session = await requireOd();
  await db
    .delete(watchZones)
    .where(and(eq(watchZones.id, zoneId), eq(watchZones.odId, session.user.odId!)));
}

export async function toggleWatchZonePaused(zoneId: string, paused: boolean) {
  const session = await requireOd();
  await db
    .update(watchZones)
    .set({ paused })
    .where(and(eq(watchZones.id, zoneId), eq(watchZones.odId, session.user.odId!)));
}

const zipSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code");

export async function geocodeZip(
  zip: string,
): Promise<{ ok: true; lat: number; lng: number } | { ok: false; error: string }> {
  await requireOd();
  const parsed = zipSchema.safeParse(zip);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ZIP" };
  }
  const result = await geocoder.geocode({
    addressLine: null,
    city: null,
    state: null,
    zip: parsed.data,
  });
  if (!result) return { ok: false, error: "ZIP not found" };
  return { ok: true, lat: result.lat, lng: result.lng };
}
