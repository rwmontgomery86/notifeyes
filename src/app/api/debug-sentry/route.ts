import * as Sentry from "@sentry/nextjs";
import { env } from "@/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY — Sentry smoke-test route. **Remove once Sentry capture is verified.**
 *
 *   GET /api/debug-sentry          → reports a test exception, returns its eventId
 *   GET /api/debug-sentry?throw=1  → throws, exercising the unhandled-error path
 *                                    (onRequestError → Sentry)
 *
 * Returns 404 unless a Sentry DSN is configured, so it's inert on deploys
 * without Sentry (dev/preview) and isn't a stray public error endpoint.
 */
export async function GET(req: Request): Promise<Response> {
  if (!env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return new Response("Not found", { status: 404 });
  }

  if (new URL(req.url).searchParams.get("throw") === "1") {
    throw new Error("NotifEyes Sentry smoke test (unhandled) — safe to ignore");
  }

  const eventId = Sentry.captureException(
    new Error("NotifEyes Sentry smoke test — safe to ignore"),
  );
  await Sentry.flush(2000);

  return Response.json({
    ok: true,
    eventId,
    note: "If Sentry is active on this deploy (DSN set + NODE_ENV=production), this error appears in your Sentry issues within ~30s — search for the eventId above. Delete this route after verifying.",
  });
}
