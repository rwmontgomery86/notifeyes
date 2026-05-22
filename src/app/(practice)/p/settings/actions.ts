"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { practices } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { geocoder } from "@/lib/geocode";

const schema = z.object({
  name: z.string().min(1).max(200),
  dba: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  yearEstablished: z.number().int().nullable().optional(),
  chairs: z.number().int().min(0).max(100).nullable().optional(),
  ehr: z.string().max(80).nullable().optional(),
  services: z.array(z.string().max(60)).max(30).optional(),
  addressLine: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().length(2).nullable().optional(),
  zip: z.string().max(10).nullable().optional(),
  photos: z.array(z.string().max(2_000_000)).max(6).optional(),
});

export async function updatePracticeSettings(input: z.infer<typeof schema>) {
  const session = await requirePractice();
  if (session.user.role === "practice_scheduler") {
    return { ok: false as const, error: "Only practice owners can edit settings." };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;
  const practiceId = session.user.practiceId!;

  // If any address field changed, re-geocode. Skip if all four are empty.
  const [existing] = await db
    .select({
      addressLine: practices.addressLine,
      city: practices.city,
      state: practices.state,
      zip: practices.zip,
    })
    .from(practices)
    .where(eq(practices.id, practiceId))
    .limit(1);

  const addressChanged =
    !existing ||
    existing.addressLine !== (v.addressLine ?? null) ||
    existing.city !== (v.city ?? null) ||
    existing.state !== (v.state?.toUpperCase() ?? null) ||
    existing.zip !== (v.zip ?? null);

  let geocodedLocationSql: ReturnType<typeof sql> | null = null;
  if (addressChanged) {
    const located = await geocoder.geocode({
      addressLine: v.addressLine ?? null,
      city: v.city ?? null,
      state: v.state ?? null,
      zip: v.zip ?? null,
    });
    if (located) {
      geocodedLocationSql = sql`ST_SetSRID(ST_MakePoint(${located.lng}, ${located.lat}), 4326)::geography`;
    } else {
      console.warn(
        `[settings] geocoder returned nothing for practice ${practiceId}`,
      );
      // Leave location alone — don't clobber a previously-correct point
      // because of a transient geocoder hiccup.
    }
  }

  await db
    .update(practices)
    .set({
      name: v.name,
      dba: v.dba ?? null,
      bio: v.bio ?? null,
      yearEstablished: v.yearEstablished ?? null,
      chairs: v.chairs ?? null,
      ehr: v.ehr ?? null,
      services: v.services ?? [],
      addressLine: v.addressLine ?? null,
      city: v.city ?? null,
      state: v.state?.toUpperCase() ?? null,
      zip: v.zip ?? null,
      photos: v.photos ?? [],
      ...(geocodedLocationSql ? { location: geocodedLocationSql } : {}),
    })
    .where(eq(practices.id, practiceId));

  return {
    ok: true as const,
    geocoded: addressChanged ? Boolean(geocodedLocationSql) : null,
  };
}
