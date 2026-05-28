# CLAUDE.md

Project context for Claude Code sessions in this repo. Read this before doing anything else; the README covers setup, this file covers conventions.

## What this is

NotifEyes — a two-sided optometry staffing marketplace. Practices post fill-in shifts; optometrists ("ODs") draw geographic *watch zones* and get pinged within 10 seconds when a matching shift posts. V1 ships all 20 surfaces from §5 of the brief and all six flows from §6.

**Stack:** Next.js 16 (App Router) + TypeScript · Postgres + PostGIS via Drizzle ORM · Auth.js v5 (JWT sessions) · pg-boss workers · Postgres `LISTEN/NOTIFY` → SSE for the <10s watch alert SLA · Leaflet maps on OpenStreetMap tiles · stubbed Stripe and SMS behind clean adapter interfaces · UploadThing for files (with a dev data-URL fallback).

## Current focus

Active workstream: **closed beta launch**. Plan, cursor, decisions log, and open questions live in [`docs/launch-plan.md`](docs/launch-plan.md).

Before doing any work in a fresh session:
1. Read `docs/launch-plan.md` end-to-end — especially the **Cursor** line at the top.
2. Report back the cursor + last-touched line + last relevant commit. Confirm with the user which checkbox to start on.
3. Do not drift past the cursor without explicit confirmation. If asked to do something off-plan, treat it as a side quest — do the work, but do **not** check off any plan steps.

When work lands, the same commit that lands it must:
- Tick the corresponding checkbox in `docs/launch-plan.md`.
- Bump the `Last touched` line at the top of the file.
- Move the `Cursor` line to the next actionable step.

Decisions settled in conversation (vendor switches, scope changes, dates, etc.) get appended to the **Decisions log** section of the plan file as they happen — never deferred to "end of session."

The Decisions log is append-only. Re-opening a settled decision means adding a new dated entry that supersedes the old one; don't edit prior entries.

## Non-obvious rules — break these and the build dies

### Server-only boundary

These modules `import "server-only"`:
- `src/env.ts`
- `src/db/index.ts`
- `src/lib/pricing.ts`
- `src/lib/queue.ts`
- `src/lib/geocode.ts`
- `src/lib/payments/stub.ts`
- `src/lib/notifications/dispatch.ts`
- `src/lib/auth/index.ts` and `src/lib/auth/guards.ts`
- `src/lib/upload-server.ts`

A `"use client"` file that imports any of them fails at build time. When a client component needs a helper from one of these, split the helper into a client-safe module. The precedent is `src/lib/format.ts` (the `formatUsd` formatter), which was extracted out of `pricing.ts` after we hit this exact bug at M4. Client-safe modules: `format.ts`, `cancellation.ts`, `contract.ts`, `dates.ts`, `state/*`, `notifications/types.ts`.

### tsx needs the `react-server` condition

The `server-only` package throws unconditionally outside Next.js's RSC environment unless the `react-server` export condition is set. The `db:migrate`, `db:seed`, and `worker` npm scripts pass `--conditions=react-server` to tsx for exactly this reason. **Do not strip that flag.**

### Drizzle-kit quotes PostGIS types

`drizzle-kit generate` emits `"geography(Point, 4326)"` (quoted) for our PostGIS columns. Postgres rejects that as an unknown type. `scripts/post-generate-drizzle.mjs` strips the quotes and is chained into the `db:generate` script. Run it via `npm run db:generate`, not bare `drizzle-kit generate`.

### `--env-file-if-exists=.env`, not `--env-file=.env`

`.env` is gitignored. CI doesn't have one — it injects env vars through the GitHub Actions `env:` block. Using `--env-file` (hard requirement) breaks CI. We use `--env-file-if-exists` (Node 22+) so the flag is a no-op when the file is absent.

### Port choice

`PORT=4000 npm run dev`. Port 3000 collides with another project the user runs locally.

### Worker is a separate process

`npm run dev` (Next.js) and `npm run worker` (pg-boss) are independent. They share the database. Only one worker should run against any given DB, or queued jobs get processed twice.

## Locked V1 decisions

| Question | Decision | Where it lives |
|---|---|---|
| SMS | Stubbed — console log + dev-only `/admin/notifications` page | `src/lib/notifications/channels/sms.ts` |
| Stripe | Stubbed — fake PaymentIntent objects; webhook scaffold present | `src/lib/payments/stub.ts` |
| OD license verification | Real admin queue (manual). `LicenseVerifier` seam exists for Verifiable/Medallion V2 | `src/app/(admin)/admin/verifications/` |
| File uploads | UploadThing in prod; data-URL fallback in dev when no token | `src/app/api/upload/route.ts`, `src/lib/upload-server.ts` |
| Launch metro | SF Bay (placeholder) | `env.NOTIFEYES_LAUNCH_METRO` + seed |
| E-sign | Click-through agreement, body frozen on Contract row | `src/lib/contract.ts` |
| Platform fee | 10% | `env.PLATFORM_FEE_BPS=1000` |
| Cancellation fees | Brief §6D percentages | `src/lib/cancellation.ts` |

Anything that needs a lawyer's review is marked `--TODO: legal review` in code. Search for it before anything ships to real users. Current TODOs: platform fee %, cancellation %, contract body, ToS/Privacy links.

## Where the spine lives

These files are the spine. **Touching them is one-agent-at-a-time** (see the README's parallel-agents section). Two agents editing in parallel WILL conflict.

- `src/db/schema.ts` — Drizzle schema, all 14 entities from §3
- `drizzle/**` — generated migrations + `manual/` PostGIS indexes
- `src/lib/state/{shift,application,booking}.ts` — state machine guards
- `src/workers/index.ts` — queue registration + cron schedules
- `src/workers/jobs/**` — fanout, follow-ups, no-show check, reminders, credential expiring, booking progression, review publisher
- `src/lib/payments/**` — payment adapter interface
- `src/lib/notifications/**` — channel adapters + dispatcher
- `src/lib/contract.ts`, `src/lib/pricing.ts`, `src/lib/cancellation.ts` — money + legal
- `src/lib/auth/**` and `src/proxy.ts` — auth model, role gates
- `src/env.ts`, `.env.example`, `package.json` — global config / deps

Side-isolated routes (safe to parallelize across agents): `src/app/(od)/**`, `src/app/(practice)/**`, `src/app/(admin)/**`.

Cross-cutting public routes that BOTH sides render (treat carefully): `src/app/shifts/[id]/`, `src/app/bookings/[id]/`, `src/app/reviews/[bookingId]/`, `src/app/messages/**`, `src/app/notifications/`, `src/app/ods/[id]/`, `src/app/practices/[id]/`.

## How to verify a change

- `npx tsc --noEmit` after any non-trivial edit — fast catch for type errors.
- `next build` (with the CI env vars: `DATABASE_URL=postgresql://ci:ci@localhost:5432/ci AUTH_SECRET=ci-dummy-secret-32-chars-aaaaaaaaa` etc.) catches server-only boundary violations and missing imports that tsc alone misses.
- The CI badge on the GitHub README turns green/red. Both jobs (`Typecheck + build` and `Playwright e2e (spine flow)`) must pass.
- For changes that touch the spine, also restart the worker (`npm run worker`) to confirm it boots — queue registration errors only surface at startup.

## Workflow expectations

1. **Propose a plan first** for any task that's 3+ steps. Don't start editing files without one. Use the TodoWrite tool to track milestones.
2. **Don't commit unless asked.** Don't push unless asked. The remote tracks `main`; CI runs on every push.
3. **Honor the side-isolation rule.** If a task drifts from a side-only scope (e.g. `(od)/`) into the spine, stop and surface it before continuing.
4. **Honor TypeScript.** Don't add `// @ts-ignore` or `as any` without explaining why. The codebase has zero of either today.
5. **Honor the locked decisions.** If a change requires un-stubbing payments / SMS / verification, say so before doing it — those are deliberate seams.

## State of play

V1 is functionally complete. The spine Playwright e2e that regressed on 2026-05-26 (post-shift no longer redirected) is **fixed and merged to `main` via PR #5 — `main` CI is green** — the bug was a cold-only client navigation race in `ShiftForm.tsx` (the new reach-estimate effect's `setReach` aborted the post-shift `router.push`), not the notification gate. Active workstream is the closed beta launch — see [`docs/launch-plan.md`](docs/launch-plan.md) for the cursor, decisions log, and step-by-step checklist.

Longer-horizon buckets after beta:

- **Tests** — Playwright coverage for flows B (invite), D (cancel), E (no-show), F (review publish), and watch-zone fanout. Vitest units for `matching.ts`, state machines, `cancellation.ts`, `pricing.ts`.
- **V2 per brief §10** — Stripe Connect (real OD payouts), Verifiable/Medallion auto-verify, recurring/permanent shifts, native mobile, multi-metro.

## Seeded dev credentials

Password for all is `password123!`.

| Role | Email |
|---|---|
| Practice owner | `owner@bayview-eye-care.dev` |
| Verified OD | `maya.patel@notifeyes.dev` |
| Pending OD (for the admin queue) | `yara.brennan@notifeyes.dev` |
| Admin | `admin@notifeyes.dev` |

## File-level pointers (most-asked-about)

- The watch-zone matching engine: `src/lib/matching.ts` (one SQL query using `ST_Contains` + filter predicates).
- The fanout worker (the <10s SLA): `src/workers/jobs/fanout-shift-posted.ts`.
- The SSE relay (browser receives notifications live): `src/app/api/notifications/stream/route.ts`.
- The /me redirect (role-based dashboard routing after login): `src/app/me/page.tsx`.
- The booking lifecycle worker (confirmed → in_progress → completed on shift times): `src/workers/jobs/booking-progression.ts`.
- The 2h review-prompt + payout delay: `enqueueBookingCompletedFollowups` in `src/lib/queue.ts`.
- The 7-day blind review publisher: `src/workers/jobs/publish-pending-reviews.ts`.
- The geocoder (Nominatim): `src/lib/geocode.ts` — has a `Geocoder` interface; Mapbox/Google can swap in.
