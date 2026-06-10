"use server";

import { revalidatePath } from "next/cache";
import { requirePractice } from "@/lib/auth/guards";
import {
  createSetupIntent,
  isStripeConfigured,
  setDefaultPaymentMethod,
} from "@/lib/payments/setup";
import { getStripeClient } from "@/lib/payments/stripe";

/**
 * Start saving a card: creates a SetupIntent and returns its clientSecret for
 * the browser Payment Element to confirm against. Gated on Stripe being
 * configured so the action is a clean no-op until keys are set.
 */
export async function startCardSetup(): Promise<
  { ok: true; clientSecret: string } | { ok: false; error: string }
> {
  const session = await requirePractice();
  if (!isStripeConfigured()) {
    return { ok: false, error: "Card payments aren't enabled yet." };
  }
  try {
    const { clientSecret } = await createSetupIntent(session.user.practiceId!);
    return { ok: true, clientSecret };
  } catch (err) {
    console.error("[billing] startCardSetup failed:", err);
    return { ok: false, error: "Could not start card setup. Please try again." };
  }
}

/**
 * Persist the card the browser just confirmed. The webhook also does this
 * (setup_intent.succeeded); both call the idempotent setDefaultPaymentMethod, so
 * whichever lands first wins and the other is a harmless no-op. We re-fetch the
 * intent server-side and verify it belongs to this practice before trusting it.
 */
export async function confirmCardSaved(
  setupIntentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requirePractice();
  const practiceId = session.user.practiceId!;
  try {
    const si = await getStripeClient().setupIntents.retrieve(setupIntentId);
    if (si.metadata?.practiceId !== practiceId) {
      return { ok: false, error: "Card setup did not match this practice." };
    }
    const pmId =
      typeof si.payment_method === "string"
        ? si.payment_method
        : si.payment_method?.id;
    if (si.status !== "succeeded" || !pmId) {
      return { ok: false, error: "Card not confirmed yet." };
    }
    await setDefaultPaymentMethod(practiceId, pmId);
    revalidatePath("/p/billing");
    return { ok: true };
  } catch (err) {
    console.error("[billing] confirmCardSaved failed:", err);
    return { ok: false, error: "Could not save card. Please try again." };
  }
}
