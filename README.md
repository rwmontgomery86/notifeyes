# NotifEyes — V1 MVP

[![CI](https://github.com/rwmontgomery86/notifeyes/actions/workflows/ci.yml/badge.svg)](https://github.com/rwmontgomery86/notifeyes/actions/workflows/ci.yml)

A two-sided marketplace connecting optometry practices with optometrists (ODs) for fill-in shifts. Watch-zone notifications are the differentiator: ODs draw a geo zone + filters and get pinged the moment a matching shift posts (< 10 s target).

## Quick start

You need a Postgres+PostGIS database. The docker-compose path is one command; alternatives are below.

```bash
# 1. Spin up Postgres + Mailpit
docker compose up -d

# 2. Install JS deps
npm install

# 3. Migrate + seed
npm run db:migrate
npm run db:seed

# 4. Run the web app (port 3000) and worker (separate process)
npm run dev
npm run worker     # in a second terminal — handles fanout + cron
```

Open <http://localhost:3000>. Seeded credentials (password for all: `password123!`):

| Role | Email |
|---|---|
| Practice owner | `owner@bayview-eye-care.dev` |
| Verified OD | `maya.patel@notifeyes.dev` |
| Pending OD | `yara.brennan@notifeyes.dev` |
| Admin | `admin@notifeyes.dev` |

Mailpit web UI: <http://localhost:8025>.

### Without Docker

If you can't run Docker, point `DATABASE_URL` in `.env` at any Postgres 15+ with the `postgis` extension available. Options:

- **Supabase** (free tier) — enable the `postgis` extension in the SQL editor, copy the connection string into `.env`.
- **Postgres.app** for macOS — install + run, then `CREATE EXTENSION postgis;` once.
- **Homebrew** — `brew install postgis` then start with `brew services start postgresql`.

`npm run db:migrate` runs `CREATE EXTENSION IF NOT EXISTS postgis;` automatically.

## What's in V1

The 20 screens from §5 of the brief, plus admin surfaces:

```
Public:    /   /login   /signup   /shifts/:id   /ods/:id   /practices/:id
Practice:  /p/dashboard   /p/shifts   /p/shifts/new   /p/shifts/:id
           /p/shifts/:id/book/:appId   /p/settings   /p/billing
OD:        /d/shifts   /d/watch   /d/profile   /d/payouts
Shared:    /notifications   /messages   /messages/:threadId
           /bookings/:id   /reviews/:bookingId
Admin:     /admin/verifications   /admin/payouts   /admin/notifications
API:       /api/auth/*   /api/notifications/stream (SSE)   /api/upload
```

All six flows from §6 (A: spine post→broadcast→apply→book, B: invite, C: OD onboarding + admin verification, D: cancellation w/ fee schedule, E: no-show, F: blind-review-publishing).

## Stack

| Layer | Pick |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| DB | Postgres 16 + PostGIS, via Drizzle ORM |
| Auth | Auth.js v5 (credentials + JWT sessions) |
| Background jobs | pg-boss (Postgres-backed queues + cron) |
| Real-time | Postgres `LISTEN/NOTIFY` → SSE at `/api/notifications/stream` |
| Maps | Leaflet + leaflet-draw, OpenStreetMap tiles |
| Email | Resend in prod; console-log fallback in dev |
| SMS | Console-log stub (locked V1 decision — Twilio swaps in via the same `NotificationChannel` interface) |
| Payments | Stubbed `PaymentProvider` interface (locked V1 decision — Stripe SDK drops in by swapping the adapter) |
| File uploads | UploadThing with a data-URL dev fallback when no token |
| UI | Tailwind + plain shadcn-style primitives |
| Testing | Playwright (`tests/spine.spec.ts`), Vitest scaffolded |

## V1 locked decisions

| Question | Decision | Where it lives |
|---|---|---|
| SMS in dev | Stub (console + `/admin/notifications`) | `src/lib/notifications/channels/sms.ts` |
| Stripe | Stubbed interface | `src/lib/payments/stub.ts` |
| OD verification | Real admin queue | `/admin/verifications` |
| File uploads | UploadThing | `src/app/api/upload/route.ts` |
| Launch metro | SF Bay (placeholder) | seed data + `env.NOTIFEYES_LAUNCH_METRO` |
| E-sign | Click-through agreement | `src/lib/contract.ts` |
| Platform fee | 10% | `env.PLATFORM_FEE_BPS=1000` (marked `--TODO: legal review`) |
| Cancellation fees | Brief §6D % schedule | `src/lib/cancellation.ts` (marked `--TODO: legal review`) |

## Architecture notes

**Watch-zone fanout (the < 10 s hot path).** When a shift transitions to `posted`, the create action enqueues a `fanout-shift-posted` pg-boss job. The worker runs `findOdsMatchingShift()`, which uses one PostGIS query (`ST_Contains` + filter predicates) to return matching ODs. Each match writes a `notifications` row and dispatches across the OD's channels. The notification insert fires `NOTIFY notification_inserted`; the SSE endpoint at `/api/notifications/stream` is subscribed via `LISTEN`, and pushes the event to the connected client. End-to-end latency target: under 10 s.

**Blind reviews.** When the second side submits, both reviews publish in the same tx. If only one side submits, the hourly `publish-pending-reviews` cron picks them up at the 7-day mark and recomputes the affected practice/OD rating aggregates.

**State machines.** `src/lib/state/{shift,application,booking}.ts` codify the §4 transitions. Every server action that mutates a status calls `assertXxxTransition()` first.

**Stubs and seams.** Payments, SMS, license verification, and UploadThing are all wired behind interfaces so that swapping in the real providers later is one file. See:
- `src/lib/payments/types.ts` ↔ `src/lib/payments/stub.ts`
- `src/lib/notifications/channels/sms.ts`
- `src/app/(admin)/admin/verifications/` (manual; Verifiable / Medallion is a V2 drop-in)
- `src/app/api/upload/route.ts`

## Repo layout

```
src/
  app/                        # Next.js routes
    (admin)/admin/...         # admin queues
    (od)/d/...                # OD dashboards
    (practice)/p/...          # practice dashboards
    (shared)/                 # messages, notifications shared across roles
    api/                      # auth, SSE, upload
  components/                 # shared client components
  db/                         # schema, migrations, seed
  lib/
    auth/                     # Auth.js config + role guards
    notifications/            # dispatcher + channel adapters
    payments/                 # PaymentProvider interface + stub
    state/                    # state-machine guards
    matching.ts               # the geo + filter matcher
  workers/
    index.ts                  # pg-boss worker entry
    jobs/                     # fanout, review publisher, completed-followups
drizzle/                      # generated SQL migrations + manual/ for PostGIS indexes
tests/spine.spec.ts           # end-to-end Playwright covering flow A
```

## Tests

```bash
npm run test:e2e         # Playwright — requires the dev server + DB running
```

The spine test (`tests/spine.spec.ts`) covers flow A: practice posts → OD applies → practice books → both see the confirmation. It runs against the seeded DB.

## Status

| Milestone | Done |
|---|:---:|
| M1 — Foundation (auth, role routing, seed) | ✓ |
| M2 — Spine flow A (post → apply → book → confirm) | ✓ |
| M3 — Watch zones + notifications | ✓ |
| M4 — Profiles (OD + Practice, edit + public) | ✓ |
| M5 — Messaging | ✓ |
| M6 — Reviews (blind 7-day publishing) | ✓ |
| M7 — Cancellation + no-show | ✓ |
| M8 — Payments stub UI (invoices, payouts, admin) | ✓ |

## TODOs that need a human

Search for `--TODO: legal review` to find every spot that uses placeholder language or a placeholder fee percentage. Specifically:

- Platform fee (currently 10%) — `src/env.ts`, `.env`
- Cancellation fee schedule (brief §6D percentages) — `src/lib/cancellation.ts`
- Click-through engagement agreement body — `src/lib/contract.ts`
- ToS / Privacy links on homepage and signup pages

## Out of scope (V2/V3)

Per §10 of the brief and the original handoff: native mobile, recurring/permanent shifts, ML matching, Stripe Connect onboarding, tax docs, video calls, multi-metro launch, automated license-board verification (Verifiable/Medallion).
