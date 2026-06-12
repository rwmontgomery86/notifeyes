import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  // Optional transaction-pooler URL for the high-churn Drizzle query pool.
  // On serverless (Vercel) this multiplexes many clients onto few Postgres
  // backends, avoiding session-pooler connection exhaustion. When unset, the
  // query pool falls back to DATABASE_URL (local dev, the worker process).
  // NEVER point the SSE LISTEN or pg-boss at this — transaction pooling has
  // no session/LISTEN support; those stay on DATABASE_URL.
  DATABASE_URL_POOLED: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().optional(),
  // Google OAuth (optional). When both are set, a "Continue with Google"
  // provider is added; Google logs in EXISTING accounts only (matched by
  // verified email) — new users still go through the signup flow.
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().default("NotifEyes <hello@notifeyes.local>"),
  RESEND_API_KEY: z.string().optional(),
  // Twilio SMS (optional). All three required to send; otherwise the channel
  // falls back to the console stub.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  // Payments. Selects the adapter in src/lib/payments. "stub" (default)
  // fabricates intents with no network; "stripe" uses the real API. The stub
  // stays active even when STRIPE_SECRET_KEY is set — flipping to Stripe is a
  // deliberate opt-in, so a key in the environment never silently goes live.
  PAYMENTS_PROVIDER: z.enum(["stub", "stripe"]).default("stub"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // The client card form (A3 Payment Element) reads NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  // directly in the browser (inlined at build, like NEXT_PUBLIC_MAPBOX_TOKEN) — it
  // isn't validated here. Card collection lights up only when BOTH the secret key
  // (server) and the publishable key (client) are set; absent either, the billing
  // page shows a "connect Stripe" placeholder. See src/lib/payments/setup.ts.
  // Maps + geocoding. MAPBOX_TOKEN is the server-side token for the geocoder;
  // when unset the geocoder falls back to Nominatim. The client tile token is
  // NEXT_PUBLIC_MAPBOX_TOKEN (read directly in map-tiles.ts; NEXT_PUBLIC vars
  // are inlined into the client bundle and aren't validated here).
  MAPBOX_TOKEN: z.string().optional(),
  // Sentry (optional). Server DSN; the client reads NEXT_PUBLIC_SENTRY_DSN
  // directly (inlined at build). Build-time-only vars (SENTRY_AUTH_TOKEN,
  // SENTRY_ORG, SENTRY_PROJECT) are read straight from process.env in
  // next.config.ts and aren't validated here. All dormant when unset.
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@notifeyes.local"),
  WORKER_URL: z.string().url().optional(),
  NOTIFEYES_LAUNCH_METRO: z.string().default("sf_bay"),
  // --TODO: legal review --- flat-fee pricing per brief §8 (V1 placeholder)
  // One flat fee per booked match; the same-day premium was removed 2026-06-10.
  NOTIFEYES_MATCH_FEE_CENTS: z.coerce.number().int().min(0).default(1000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
