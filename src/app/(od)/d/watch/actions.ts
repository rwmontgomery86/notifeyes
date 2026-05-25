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

const HHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");

const createSchema = z.object({
  name: z.string().min(1).max(100),
  minRateCents: z.number().int().min(0).max(1_000_000),
  geometryMeta: z.union([circleSchema, polygonSchema]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
  timeStart: HHMM.optional().nullable(),
  timeEnd: HHMM.optional().nullable(),
  shiftTypes: z
    .array(z.enum(["fill_in", "half_day", "weekend", "recurring", "permanent"]))
    .min(1)
    .optional(),
  notifyChannels: z.array(z.enum(["push", "email", "sms"])).min(1).optional(),
});

export async function createWatchZone(input: z.infer<typeof createSchema>) {
  const session = await requireOd();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const odId = session.user.odId!;

  const [u] = await db
    .select({
      email: users.email,
      phone: users.phone,
      emailOptedIn: users.emailOptedIn,
      smsOptedIn: users.smsOptedIn,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u || !hasAnyNotificationChannel(u)) {
    return {
      ok: false as const,
      error:
        "Enable at least one notification channel in your profile before creating a watch zone.",
    };
  }

  const daysOfWeek = v.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
  const shiftTypes = v.shiftTypes ?? ["fill_in", "half_day", "weekend"];
  const notifyChannels = v.notifyChannels ?? ["push", "email"];
  const timeStart = v.timeStart ?? null;
  const timeEnd = v.timeEnd ?? null;

  // Build the PostGIS geometry. For circles, we approximate with ST_Buffer of
  // a point in meters (geography) and convert back to geometry for storage.
  if (v.geometryMeta.kind === "circle") {
    const { centerLat, centerLng, radiusMeters } = v.geometryMeta;
    await db.execute(sql`
      INSERT INTO watch_zones (od_id, name, shape, geometry, geometry_meta, min_rate_cents, days_of_week, time_start, time_end, shift_types, notify_channels)
      VALUES (
        ${odId},
        ${v.name},
        'circle',
        ST_Buffer(
          ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography,
          ${radiusMeters}
        )::geometry::geography,
        ${JSON.stringify(v.geometryMeta)}::jsonb,
        ${v.minRateCents},
        ${JSON.stringify(daysOfWeek)}::jsonb,
        ${timeStart},
        ${timeEnd},
        ${JSON.stringify(shiftTypes)}::jsonb,
        ${JSON.stringify(notifyChannels)}::jsonb
      );
    `);
  } else {
    const ringWkt =
      "POLYGON((" +
      [
        ...v.geometryMeta.points.map((p) => `${p.lng} ${p.lat}`),
        // close the ring
        `${v.geometryMeta.points[0]!.lng} ${v.geometryMeta.points[0]!.lat}`,
      ].join(", ") +
      "))";
    await db.execute(sql`
      INSERT INTO watch_zones (od_id, name, shape, geometry, geometry_meta, min_rate_cents, days_of_week, time_start, time_end, shift_types, notify_channels)
      VALUES (
        ${odId},
        ${v.name},
        'polygon',
        ST_SetSRID(ST_GeomFromText(${ringWkt}), 4326)::geography,
        ${JSON.stringify(v.geometryMeta)}::jsonb,
        ${v.minRateCents},
        ${JSON.stringify(daysOfWeek)}::jsonb,
        ${timeStart},
        ${timeEnd},
        ${JSON.stringify(shiftTypes)}::jsonb,
        ${JSON.stringify(notifyChannels)}::jsonb
      );
    `);
  }

  return { ok: true as const };
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
