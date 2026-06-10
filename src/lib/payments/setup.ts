import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { practices } from "@/db/schema";
import { env } from "@/env";
import { getStripeClient } from "./stripe";

/**
 * A3 card-on-file setup. Distinct from the PaymentProvider seam (which moves
 * money): this module collects + saves a practice's card via a SetupIntent so
 * later bookings can authorize the $10 match-fee hold off_session.
 *
 * Card collection is available whenever Stripe is configured (both keys set) —
 * independent of PAYMENTS_PROVIDER. That lets a practice save a card while the
 * booking flow is still on the stub; flipping PAYMENTS_PROVIDER=stripe is what
 * actually routes the hold through the saved card.
 */

/** True only when BOTH the server secret and the client publishable key exist. */
export function isStripeConfigured(): boolean {
  return (
    Boolean(env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}

export interface SavedCard {
  paymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/** Ensure a Stripe Customer exists for the practice; returns its id (cached). */
export async function ensureStripeCustomer(practiceId: string): Promise<string> {
  const [p] = await db
    .select({
      id: practices.id,
      name: practices.name,
      stripeCustomerId: practices.stripeCustomerId,
    })
    .from(practices)
    .where(eq(practices.id, practiceId))
    .limit(1);
  if (!p) throw new Error("Practice not found");
  if (p.stripeCustomerId) return p.stripeCustomerId;

  const customer = await getStripeClient().customers.create({
    name: p.name,
    metadata: { practiceId },
  });
  await db
    .update(practices)
    .set({ stripeCustomerId: customer.id })
    .where(eq(practices.id, practiceId));
  return customer.id;
}

/**
 * Create an off_session SetupIntent for saving a card. Returns the clientSecret
 * the browser Payment Element confirms against. The practiceId rides in metadata
 * so the webhook can persist the resulting payment method.
 */
export async function createSetupIntent(
  practiceId: string,
): Promise<{ clientSecret: string }> {
  const customerId = await ensureStripeCustomer(practiceId);
  const si = await getStripeClient().setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
    metadata: { practiceId },
  });
  if (!si.client_secret) {
    throw new Error("SetupIntent did not return a client_secret");
  }
  return { clientSecret: si.client_secret };
}

/**
 * Persist a saved payment method as the practice's default. Called both from the
 * client (right after confirmSetup) and from the webhook (setup_intent.succeeded)
 * — idempotent, so a double-call is harmless.
 */
export async function setDefaultPaymentMethod(
  practiceId: string,
  paymentMethodId: string,
): Promise<void> {
  const customerId = await ensureStripeCustomer(practiceId);
  await getStripeClient().customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  await db
    .update(practices)
    .set({ defaultPaymentMethodId: paymentMethodId, paymentMethodVerified: true })
    .where(eq(practices.id, practiceId));
}

/** Fetch the saved card's display details (brand/last4) for the billing UI. */
export async function getSavedCard(
  practiceId: string,
): Promise<SavedCard | null> {
  const [p] = await db
    .select({ defaultPaymentMethodId: practices.defaultPaymentMethodId })
    .from(practices)
    .where(eq(practices.id, practiceId))
    .limit(1);
  if (!p?.defaultPaymentMethodId) return null;
  try {
    const pm = await getStripeClient().paymentMethods.retrieve(
      p.defaultPaymentMethodId,
    );
    if (!pm.card) return null;
    return {
      paymentMethodId: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  } catch {
    return null;
  }
}
