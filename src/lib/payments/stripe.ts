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
 * Card collection lives in ./setup.ts (A3): the practice saves a card once via a
 * SetupIntent, and `createIntent` then confirms the match-fee hold off_session
 * against that saved customer + payment method (see the offSession branch below).
 * Without a saved card the intent stays at `requires_payment_method`. The webhook
 * (/api/payments/webhook) reconciles `booking.paymentStatus` and persists the
 * saved card on setup_intent.succeeded.
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

/**
 * Shared Stripe client for sibling server-only modules (setup.ts, the webhook)
 * so the SDK is instantiated once. Throws if STRIPE_SECRET_KEY is unset.
 */
export function getStripeClient(): Stripe {
  return stripe();
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
    // A3: when the practice has a saved card (customer + payment method), confirm
    // the intent immediately off_session — this places the $10 hold at booking
    // time with no client interaction. Without a saved card we fall back to an
    // un-confirmed intent (requires_payment_method) so importing/merging this is
    // inert until cards are on file.
    const offSession = Boolean(input.stripeCustomerId && input.paymentMethodId);
    const pi = await stripe().paymentIntents.create({
      amount: input.amountCents,
      currency: "usd",
      capture_method: input.captureMethod,
      description: input.description,
      metadata: { bookingId: input.bookingId, practiceId: input.practiceId },
      ...(offSession
        ? {
            customer: input.stripeCustomerId,
            payment_method: input.paymentMethodId,
            off_session: true,
            confirm: true,
          }
        : {
            // No redirect-based methods — this seam has no client redirect handling.
            automatic_payment_methods: { enabled: true, allow_redirects: "never" },
          }),
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
