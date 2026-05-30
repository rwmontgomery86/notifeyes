import "server-only";
import Stripe from "stripe";
import { env } from "@/env";
import type {
  CreatePaymentIntentInput,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentProvider,
} from "./types";

/**
 * Real Stripe PaymentProvider (test-mode keys until the LLC clears).
 *
 * Selected only when PAYMENTS_PROVIDER=stripe (see ./index.ts) — never merely
 * because a key is present. The client is created lazily so importing this
 * module is side-effect-free when the stub is active.
 *
 * NOTE: this seam has no client card-collection step yet, so `createIntent`
 * returns an intent in `requires_payment_method` — the booking flow records
 * that status but no money moves until a Payment Element / Checkout step
 * authorizes the intent. The webhook (/api/payments/webhook) reconciles
 * `booking.paymentStatus` once an intent is confirmed/captured out-of-band.
 */

let client: Stripe | null = null;
function stripe(): Stripe {
  if (!client) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error(
        "STRIPE_SECRET_KEY is required for the Stripe payment provider",
      );
    }
    client = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return client;
}

/** Map Stripe's status vocabulary onto our narrower PaymentIntentStatus. */
export function mapStatus(s: Stripe.PaymentIntent.Status): PaymentIntentStatus {
  switch (s) {
    case "requires_payment_method":
      return "requires_payment_method";
    case "requires_confirmation":
    case "requires_action":
      return "requires_confirmation";
    case "requires_capture":
    case "processing":
      return "requires_capture";
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    default:
      return "failed";
  }
}

function toIntent(pi: Stripe.PaymentIntent): PaymentIntent {
  return {
    id: pi.id,
    amountCents: pi.amount,
    currency: pi.currency,
    status: mapStatus(pi.status),
    clientSecret: pi.client_secret ?? undefined,
    bookingId:
      typeof pi.metadata?.bookingId === "string"
        ? pi.metadata.bookingId
        : undefined,
    capturedAt: pi.status === "succeeded" ? new Date().toISOString() : undefined,
  };
}

export const stripePaymentProvider: PaymentProvider = {
  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    const pi = await stripe().paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      capture_method: input.captureMethod,
      description: input.description,
      metadata: { bookingId: input.bookingId, practiceId: input.practiceId },
      // No redirect-based methods — this seam has no client redirect handling.
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });
    return toIntent(pi);
  },

  async capture(id: string): Promise<PaymentIntent> {
    return toIntent(await stripe().paymentIntents.capture(id));
  },

  async cancel(id: string): Promise<PaymentIntent> {
    return toIntent(await stripe().paymentIntents.cancel(id));
  },

  async refund(id: string, amountCents?: number): Promise<PaymentIntent> {
    await stripe().refunds.create({
      payment_intent: id,
      ...(amountCents != null ? { amount: amountCents } : {}),
    });
    return toIntent(await stripe().paymentIntents.retrieve(id));
  },

  async retrieve(id: string): Promise<PaymentIntent | null> {
    try {
      return toIntent(await stripe().paymentIntents.retrieve(id));
    } catch {
      return null;
    }
  },
};
