"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { confirmCardSaved, startCardSetup } from "./actions";

// Publishable key is inlined into the client bundle at build (like the Mapbox
// token). The server only renders this component when Stripe is configured, so
// the key is present whenever this runs. loadStripe is memoized at module scope.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!stripePromise && publishableKey) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

export function AddCardForm({ hasCard }: { hasCard: boolean }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function begin() {
    setError(null);
    startTransition(async () => {
      const res = await startCardSetup();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setClientSecret(res.clientSecret);
    });
  }

  if (clientSecret) {
    const stripe = getStripe();
    if (!stripe) {
      return (
        <p className="text-sm text-destructive">
          Stripe failed to load. Refresh and try again.
        </p>
      );
    }
    return (
      <Elements
        stripe={stripe}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <CardFields onCancel={() => setClientSecret(null)} />
      </Elements>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={begin}
        disabled={starting}
        className="ne-btn h-9 px-4 text-sm"
      >
        {starting ? "Starting…" : hasCard ? "Replace card" : "Add a card"}
      </button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function CardFields({ onCancel }: { onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmErr, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Could not save card.");
      setSubmitting(false);
      return;
    }
    if (setupIntent?.status === "succeeded") {
      const res = await confirmCardSaved(setupIntent.id);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      router.refresh();
      return;
    }
    setError("Card setup didn't complete. Please try again.");
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="ne-btn h-9 px-4 text-sm"
        >
          {submitting ? "Saving…" : "Save card"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="ne-btn-ghost h-9 px-4 text-sm"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
