import { stubPaymentProvider } from "./stub";
import type { PaymentProvider } from "./types";

/**
 * The active PaymentProvider for this process.
 *
 * V1 always returns the stub (per locked decision). When swapping to real
 * Stripe later, gate on env.STRIPE_SECRET_KEY presence + a feature flag.
 */
export const payments: PaymentProvider = stubPaymentProvider;

export type * from "./types";
