import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { mapStatus } from "@/lib/payments/stripe";
import { setDefaultPaymentMethod } from "@/lib/payments/setup";

// Stripe SDK + the pg pool need the Node runtime.
export const runtime = "nodejs";

/**
 * Stripe webhook. Verifies the signature against STRIPE_WEBHOOK_SECRET and
 * reconciles booking.paymentStatus from payment_intent.* events (the intent's
 * metadata carries the bookingId, set in the Stripe adapter's createIntent).
 *
 * Returns 503 when Stripe isn't configured so a misfired delivery is a clear
 * no-op rather than a 500. The raw request body is required for signature
 * verification — never parse it first.
 */
export async function POST(req: Request): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe webhook not configured", { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing stripe-signature", { status: 400 });

  const raw = await req.text();
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      raw,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return new Response(`Signature verification failed: ${String(err)}`, {
      status: 400,
    });
  }

  if (event.type.startsWith("payment_intent.")) {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId =
      typeof pi.metadata?.bookingId === "string" ? pi.metadata.bookingId : null;
    if (bookingId) {
      await db
        .update(bookings)
        .set({ paymentStatus: mapStatus(pi.status) })
        .where(eq(bookings.id, bookingId));
    }
  }

  // A3: a card was saved off_session — persist it as the practice's default so
  // future bookings can authorize the hold. The client also persists this on
  // confirm; setDefaultPaymentMethod is idempotent, so a double-write is fine.
  if (event.type === "setup_intent.succeeded") {
    const si = event.data.object as Stripe.SetupIntent;
    const practiceId =
      typeof si.metadata?.practiceId === "string" ? si.metadata.practiceId : null;
    const paymentMethodId =
      typeof si.payment_method === "string"
        ? si.payment_method
        : (si.payment_method?.id ?? null);
    if (practiceId && paymentMethodId) {
      await setDefaultPaymentMethod(practiceId, paymentMethodId);
    }
  }

  return new Response("ok", { status: 200 });
}
