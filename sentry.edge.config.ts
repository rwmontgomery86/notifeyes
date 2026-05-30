// Sentry edge-runtime init (middleware + any edge routes). Loaded by
// `src/instrumentation.ts` via register() when NEXT_RUNTIME === "edge".
// Same dormancy rules as the server config.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
  });
}
