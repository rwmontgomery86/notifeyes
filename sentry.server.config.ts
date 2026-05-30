// Sentry server-side init (Node runtime). Loaded by `src/instrumentation.ts`
// via register() when NEXT_RUNTIME === "nodejs".
//
// Dormant unless SENTRY_DSN (or the public DSN) is set, and only *sends* in
// production — so dev/test/CI with no Sentry env is a complete no-op.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    // Beta scale is low-volume; full tracing is affordable. Tune down later.
    tracesSampleRate: 1.0,
    // Don't attach IP/headers/cookies by default — see the PII risk in the
    // launch plan. Opt in deliberately if we ever need it.
    sendDefaultPii: false,
  });
}
