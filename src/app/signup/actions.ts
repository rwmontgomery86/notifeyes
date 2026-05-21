"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { optometrists, practices, users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { geocoder } from "@/lib/geocode";
import { uploadFile } from "@/lib/upload-server";

const baseSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(200),
});

const practiceSignupSchema = baseSchema.extend({
  practiceName: z.string().min(2).max(200),
  addressLine: z.string().min(2).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().min(5).max(10),
});

const odSignupSchema = baseSchema.extend({
  licenseState: z.string().length(2),
  licenseNumber: z.string().min(2).max(80),
  // Optional in step 1 of signup — uploaded after via the verification queue
  // path. Brief §6C says verification happens async.
});

export type SignupResult = {
  ok: boolean;
  error?: string;
};

export async function signupPractice(formData: FormData): Promise<SignupResult> {
  const parsed = practiceSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Email uniqueness check
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (existing.length) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Geocode before insert. If the geocoder fails or returns no result,
  // we still create the practice — but log it; an admin can backfill.
  const located = await geocoder.geocode({
    addressLine: data.addressLine,
    city: data.city,
    state: data.state,
    zip: data.zip,
  });
  if (!located) {
    console.warn(
      `[signup:practice] geocoder failed for "${data.addressLine}, ${data.city}, ${data.state} ${data.zip}" — practice will need admin backfill`,
    );
  }

  await db.transaction(async (tx) => {
    const [practice] = await tx
      .insert(practices)
      .values({
        name: data.practiceName,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state.toUpperCase(),
        zip: data.zip,
        location: located
          ? sql`ST_SetSRID(ST_MakePoint(${located.lng}, ${located.lat}), 4326)::geography`
          : null,
      })
      .returning({ id: practices.id });

    await tx.insert(users).values({
      email: data.email,
      name: data.name,
      passwordHash,
      role: "practice_owner",
      practiceId: practice.id,
      emailVerifiedAt: sql`now()`, // V1 — skip email verification flow
    });
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });
  redirect("/p/dashboard");
}

export async function signupOd(formData: FormData): Promise<SignupResult> {
  // Pull the file separately — z.object().parse on FormData doesn't validate
  // File entries cleanly, and we don't want to fail signup over a missing
  // file (it's optional).
  const licenseDocEntry = formData.get("licenseDoc");
  const fieldEntries = Object.fromEntries(
    Array.from(formData.entries()).filter(([, v]) => typeof v === "string"),
  );
  const parsed = odSignupSchema.safeParse(fieldEntries);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (existing.length) {
    return { ok: false, error: "An account with that email already exists." };
  }

  // Upload the license doc (if provided) BEFORE creating the account — so a
  // failed upload doesn't leave a half-baked OD row.
  let licenseDocUrl: string | null = null;
  if (licenseDocEntry instanceof File && licenseDocEntry.size > 0) {
    const upload = await uploadFile(licenseDocEntry);
    if (!upload.ok) {
      return { ok: false, error: `License doc: ${upload.error}` };
    }
    licenseDocUrl = upload.url;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.transaction(async (tx) => {
    const [od] = await tx
      .insert(optometrists)
      .values({
        name: data.name,
        licenseState: data.licenseState.toUpperCase(),
        licenseNumber: data.licenseNumber,
        licenseDocUrl,
        // verificationStatus defaults to 'pending' — must be verified via
        // /admin/verifications before they can apply (§6C gate)
      })
      .returning({ id: optometrists.id });

    await tx.insert(users).values({
      email: data.email,
      name: data.name,
      passwordHash,
      role: "od",
      odId: od.id,
      emailVerifiedAt: sql`now()`,
    });
  });

  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });
  redirect("/d/shifts");
}
