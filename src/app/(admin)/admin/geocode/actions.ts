"use server";

import { eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { practices } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { geocoder } from "@/lib/geocode";

export async function backfillGeocodes() {
  await requireAdmin();

  const missing = await db
    .select({
      id: practices.id,
      addressLine: practices.addressLine,
      city: practices.city,
      state: practices.state,
      zip: practices.zip,
    })
    .from(practices)
    .where(isNull(practices.location))
    .limit(200);

  let resolved = 0;
  let skipped = 0;

  for (const p of missing) {
    const located = await geocoder.geocode({
      addressLine: p.addressLine,
      city: p.city,
      state: p.state,
      zip: p.zip,
    });
    if (!located) {
      skipped++;
      continue;
    }
    await db
      .update(practices)
      .set({
        location: sql`ST_SetSRID(ST_MakePoint(${located.lng}, ${located.lat}), 4326)::geography`,
      })
      .where(eq(practices.id, p.id));
    resolved++;
  }

  return { resolved, skipped };
}
