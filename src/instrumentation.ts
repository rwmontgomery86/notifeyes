// Next.js instrumentation hook. Runs once per server/edge runtime at boot and
// loads the matching Sentry config. The configs themselves are dormant unless
// a DSN is set, so this is a no-op without Sentry env.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures errors thrown while rendering nested React Server Components.
// Safe when Sentry is uninitialized — it simply has nothing to report to.
export const onRequestError = Sentry.captureRequestError;
