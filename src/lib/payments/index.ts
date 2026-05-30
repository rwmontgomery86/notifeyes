import "server-only";
import { env } from "@/env";
import { stubPaymentProvider } from "./stub";
import { stripePaymentProvider } from "./stripe";
import type { PaymentProvider } from "./types";

/**
 * The active PaymentProvider for this process.
 *
 * The stub is the DEFAULT and stays active even when STRIPE_SECRET_KEY is
 * present — flipping to real Stripe is a deliberate opt-in via
 * PAYMENTS_PROVIDER=stripe. So deploying this never changes behavior until the
 * flag is set (and a card-collection step exists to authorize intents).
 */
function selectProvider(): PaymentProvider {
  if (env.PAYMENTS_PROVIDER === "stripe") {
    if (env.STRIPE_SECRET_KEY) return stripePaymentProvider;
    console.warn(
      "[payments] PAYMENTS_PROVIDER=stripe but STRIPE_SECRET_KEY is unset — using the stub.",
    );
  }
  return stubPaymentProvider;
}

export const payments: PaymentProvider = selectProvider();

export type * from "./types";
