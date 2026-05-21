"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { optometrists } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";

const schema = z.object({
  displayName: z.string().max(200).nullable().optional(),
  headshotUrl: z.string().max(8000).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  travelRadiusMi: z.number().int().min(5).max(200).optional(),
  licenseDocUrl: z.string().max(8000).nullable().optional(),
  deaUrl: z.string().max(8000).nullable().optional(),
  malpracticeUrl: z.string().max(8000).nullable().optional(),
  cprUrl: z.string().max(8000).nullable().optional(),
  npiNumber: z.string().max(20).nullable().optional(),
  ehrExperience: z.array(z.string().max(60)).max(20).optional(),
  specialties: z.array(z.string().max(60)).max(20).optional(),
});

export async function updateOdProfile(input: z.infer<typeof schema>) {
  const session = await requireOd();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  await db
    .update(optometrists)
    .set({
      displayName: v.displayName ?? null,
      headshotUrl: v.headshotUrl ?? null,
      bio: v.bio ?? null,
      travelRadiusMi: v.travelRadiusMi ?? undefined,
      licenseDocUrl: v.licenseDocUrl ?? null,
      deaUrl: v.deaUrl ?? null,
      malpracticeUrl: v.malpracticeUrl ?? null,
      cprUrl: v.cprUrl ?? null,
      npiNumber: v.npiNumber ?? null,
      ehrExperience: v.ehrExperience ?? [],
      specialties: v.specialties ?? [],
    })
    .where(eq(optometrists.id, session.user.odId!));

  return { ok: true as const };
}
