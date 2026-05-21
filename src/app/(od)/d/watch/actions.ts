"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { watchZones } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";

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
});

export async function createWatchZone(input: z.infer<typeof createSchema>) {
  const session = await requireOd();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const odId = session.user.odId!;

  // Build the PostGIS geometry. For circles, we approximate with ST_Buffer of
  // a point in meters (geography) and convert back to geometry for storage.
  if (v.geometryMeta.kind === "circle") {
    const { centerLat, centerLng, radiusMeters } = v.geometryMeta;
    await db.execute(sql`
      INSERT INTO watch_zones (od_id, name, shape, geometry, geometry_meta, min_rate_cents)
      VALUES (
        ${odId},
        ${v.name},
        'circle',
        ST_Buffer(
          ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography,
          ${radiusMeters}
        )::geometry::geography,
        ${JSON.stringify(v.geometryMeta)}::jsonb,
        ${v.minRateCents}
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
      INSERT INTO watch_zones (od_id, name, shape, geometry, geometry_meta, min_rate_cents)
      VALUES (
        ${odId},
        ${v.name},
        'polygon',
        ST_SetSRID(ST_GeomFromText(${ringWkt}), 4326)::geography,
        ${JSON.stringify(v.geometryMeta)}::jsonb,
        ${v.minRateCents}
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
