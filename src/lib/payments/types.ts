/**
 * PaymentProvider — the seam between our app and the real card processor.
 *
 * V1: see `./stub.ts` for the in-process implementation. It fabricates
 * PaymentIntents and "charges" by flipping their status synchronously.
 * V2+: replace with `./stripe.ts` (Stripe SDK), wire webhook handler at
 * `/api/payments/webhook`.
 */

export type PaymentIntentStatus =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_capture"
  | "succeeded"
  | "canceled"
  | "failed";

export interface PaymentIntent {
  id: string;
  amountCents: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret?: string;
  bookingId?: string;
  capturedAt?: string;
}

export interface CreatePaymentIntentInput {
  amountCents: number;
  bookingId: string;
  practiceId: string;
  description?: string;
  /** Authorize-only; capture separately at shift completion. */
  captureMethod: "automatic" | "manual";
}

export interface PaymentProvider {
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent>;
  capture(paymentIntentId: string): Promise<PaymentIntent>;
  cancel(paymentIntentId: string): Promise<PaymentIntent>;
  refund(paymentIntentId: string, amountCents?: number): Promise<PaymentIntent>;
  /** Convenience for V1 — return the latest snapshot of an intent. */
  retrieve(paymentIntentId: string): Promise<PaymentIntent | null>;
}
