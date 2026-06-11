"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { odPracticeBlocks, optometrists, users } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";
import { geocoder } from "@/lib/geocode";

// URL fields are widened to fit data-URL fallback payloads (dev mode without
// UploadThing). Compressed images land around 200-500K base64 chars; 2M gives
// headroom while still bounding the row.
const URL_MAX = 2_000_000;

const schema = z.object({
  displayName: z.string().max(200).nullable().optional(),
  headshotUrl: z.string().max(URL_MAX).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  travelRadiusMi: z.number().int().min(5).max(200).optional(),
  homeZip: z.string().max(10).nullable().optional(),
  licenseDocUrl: z.string().max(URL_MAX).nullable().optional(),
  deaUrl: z.string().max(URL_MAX).nullable().optional(),
  malpracticeUrl: z.string().max(URL_MAX).nullable().optional(),
  cprUrl: z.string().max(URL_MAX).nullable().optional(),
  npiNumber: z.string().max(20).nullable().optional(),
  ehrExperience: z.array(z.string().max(60)).max(20).optional(),
  specialties: z.array(z.string().max(60)).max(20).optional(),
  phone: z.string().max(32).nullable().optional(),
  smsOptedIn: z.boolean().optional(),
  emailOptedIn: z.boolean().optional(),
  conciergeOptedIn: z.boolean().optional(),
});

export async function updateOdProfile(input: z.infer<typeof schema>) {
  const session = await requireOd();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const phone = v.phone?.trim() || null;
  if (v.smsOptedIn && !phone) {
    return {
      ok: false as const,
      error: "Add a phone number before opting in to SMS notifications.",
    };
  }

  const homeZip = v.homeZip?.trim() || null;
  if (homeZip && !/^\d{5}(-\d{4})?$/.test(homeZip)) {
    return { ok: false as const, error: "Enter a 5-digit ZIP code." };
  }

  // Geocode the home ZIP into homeLocation, but only when it changed —
  // Nominatim (the dev fallback geocoder) is rate-limited to 1 req/s.
  const [existing] = await db
    .select({ homeZip: optometrists.homeZip })
    .from(optometrists)
    .where(eq(optometrists.id, session.user.odId!))
    .limit(1);
  const zipChanged = (existing?.homeZip ?? null) !== homeZip;

  let homeLocationSql: ReturnType<typeof sql> | null = null;
  if (zipChanged && homeZip) {
    const located = await geocoder.geocode({
      addressLine: null,
      city: null,
      state: null,
      zip: homeZip,
    });
    if (!located) {
      return {
        ok: false as const,
        error: "We couldn't find that ZIP code — double-check it.",
      };
    }
    homeLocationSql = sql`ST_SetSRID(ST_MakePoint(${located.lng}, ${located.lat}), 4326)::geography`;
  }

  await db
    .update(optometrists)
    .set({
      displayName: v.displayName ?? null,
      headshotUrl: v.headshotUrl ?? null,
      bio: v.bio ?? null,
      travelRadiusMi: v.travelRadiusMi ?? undefined,
      // A cleared ZIP also clears the geocoded point.
      ...(zipChanged ? { homeZip, homeLocation: homeLocationSql } : {}),
      licenseDocUrl: v.licenseDocUrl ?? null,
      deaUrl: v.deaUrl ?? null,
      malpracticeUrl: v.malpracticeUrl ?? null,
      cprUrl: v.cprUrl ?? null,
      npiNumber: v.npiNumber ?? null,
      ehrExperience: v.ehrExperience ?? [],
      specialties: v.specialties ?? [],
    })
    .where(eq(optometrists.id, session.user.odId!));

  await db
    .update(users)
    .set({
      phone,
      smsOptedIn: v.smsOptedIn ?? false,
      emailOptedIn: v.emailOptedIn ?? false,
      conciergeOptedIn: v.conciergeOptedIn ?? false,
    })
    .where(eq(users.id, session.user.id));

  return { ok: true as const };
}

export async function unblockPracticeFromProfile(practiceId: string) {
  const session = await requireOd();
  await db
    .delete(odPracticeBlocks)
    .where(
      and(
        eq(odPracticeBlocks.odId, session.user.odId!),
        eq(odPracticeBlocks.practiceId, practiceId),
      ),
    );
  return { ok: true as const };
}
