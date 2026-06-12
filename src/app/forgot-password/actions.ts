"use server";

import { z } from "zod";
import { createAndSendPasswordReset } from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
});

/**
 * Always resolves to { ok: true } — an unknown, invalid, or failing email
 * must be indistinguishable from a successful request (no account
 * enumeration). Failures are logged server-side only.
 */
export async function requestPasswordReset(formData: FormData): Promise<{ ok: true }> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (parsed.success) {
    try {
      await createAndSendPasswordReset(parsed.data.email);
    } catch (err) {
      console.error("[password-reset] request failed:", err);
    }
  }
  return { ok: true };
}
