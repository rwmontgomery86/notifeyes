"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { consumeResetAndSetPassword } from "@/lib/password-reset";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export type ResetPasswordResult = { ok: false; error: string };

/** Redirects to /login?reset=1 on success; only returns on failure. */
export async function resetPassword(
  token: string,
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Same hashing as signup (src/app/signup/actions.ts) so credentials login
  // verifies it unchanged.
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const consumed = await consumeResetAndSetPassword(token, passwordHash);
  if (!consumed) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }
  redirect("/login?reset=1");
}
