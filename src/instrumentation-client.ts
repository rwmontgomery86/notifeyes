// Sentry browser init. Next.js loads this on the client before hydration.
// Reads the *public* DSN (inlined at build time). Dormant unless set, and only
// sends in production. No Session Replay — keeps the bundle lean and avoids
// capturing PII (see the launch plan's PII risk).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
  });
}

// Instruments client-side route transitions for tracing. Safe no-op when
// Sentry is uninitialized.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
