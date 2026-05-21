import "server-only";
import { randomUUID } from "node:crypto";
import type {
  CreatePaymentIntentInput,
  PaymentIntent,
  PaymentProvider,
} from "./types";

/**
 * Stubbed PaymentProvider — V1 only.
 *
 * Holds PaymentIntents in a per-process Map. Persists nothing across restarts,
 * which is fine because we also store payment_intent_id on the Booking row;
 * lookups for old intents return a fabricated "succeeded" snapshot.
 *
 * Replace with the real Stripe adapter when payments go live.
 */
const intents = new Map<string, PaymentIntent>();

export const stubPaymentProvider: PaymentProvider = {
  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
    const id = `pi_stub_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const intent: PaymentIntent = {
      id,
      amountCents: input.amountCents,
      currency: "usd",
      // Authorize-only — captured at shift completion or on booking cancel
      // depending on cancellation policy. V1 books treat the auth as effectively
      // committed; we don't capture in dev.
      status: input.captureMethod === "manual" ? "requires_capture" : "succeeded",
      clientSecret: `${id}_secret_stub`,
      bookingId: input.bookingId,
    };
    intents.set(id, intent);
    console.log(
      `[payments:stub] created ${id} (${(input.amountCents / 100).toFixed(2)} ${intent.currency}, status=${intent.status})`,
    );
    return intent;
  },

  async capture(id: string): Promise<PaymentIntent> {
    const existing = intents.get(id) ?? fabricate(id);
    const updated: PaymentIntent = {
      ...existing,
      status: "succeeded",
      capturedAt: new Date().toISOString(),
    };
    intents.set(id, updated);
    console.log(`[payments:stub] captured ${id}`);
    return updated;
  },

  async cancel(id: string): Promise<PaymentIntent> {
    const existing = intents.get(id) ?? fabricate(id);
    const updated: PaymentIntent = { ...existing, status: "canceled" };
    intents.set(id, updated);
    console.log(`[payments:stub] canceled ${id}`);
    return updated;
  },

  async refund(id: string, amountCents?: number): Promise<PaymentIntent> {
    const existing = intents.get(id) ?? fabricate(id);
    console.log(
      `[payments:stub] refunded ${id} (${amountCents ? (amountCents / 100).toFixed(2) : "full"})`,
    );
    return existing;
  },

  async retrieve(id: string): Promise<PaymentIntent | null> {
    return intents.get(id) ?? fabricate(id);
  },
};

function fabricate(id: string): PaymentIntent {
  return {
    id,
    amountCents: 0,
    currency: "usd",
    status: "succeeded",
  };
}
