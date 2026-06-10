# Beta launch plan

> **How to use this file.** This is the persistent cross-session source of
> truth for the closed-beta workstream. The cursor below is the bookmark —
> on a fresh session or a fresh machine, read it first to know where to
> resume. When work lands, the commit that lands it must also tick the
> checkbox here and bump `Last touched`.

**Last touched:** 2026-05-30 (Phase-1 alert pipeline **PROVEN end-to-end in
prod.** Ross ran the watch-zone smoke: real OD → Bay Area watch zone → shift
posted by the seeded practice → OD received the **in-app notification + a real
email** from notifications@notifeyes.com. Railway worker confirmed online
(listening on all 8 queues; `DATABASE_URL` on the session pooler/5432, not the
txn pooler; `AUTH_SECRET` present). **LLC cleared + EIN received** (business bank
account this week) — Stripe is now live-capable. One transient `EMAXCONNSESSION`
(session `pool_size: 15`) hit on worker startup and self-recovered; root-caused
to pg-boss's default pool (10) + the Drizzle pool (5) = 15, and **fixed** by
capping pg-boss at 5 in `boss.ts`. Still open on Phase 1: Stripe Payment Element
checkout (held), Twilio activation (compliance pending) + the SMS leg of the
smoke. Earlier today: #16 Sentry + #17 PostHog verified live, #18 Stripe
foundational adapter merged, #23 `/api/health` shipped.)
**Cursor:** Phase 1 plumbing — final leg. RESUME HERE: all integrations merged +
deployed; worker running; **e2e alert smoke passed (in-app + email)**; LLC + EIN
cleared. Remaining on Phase 1:
1. **Twilio activation** (compliance pending) → buy a US number → set the 3
   `TWILIO_*` vars on **both** Vercel + Railway (no code) → re-run the **SMS leg**
   of the smoke. The last unverified channel; in-app + email already proven.
2. **Stripe Payment Element checkout** (held) — the card step so a real
   test-mode PaymentIntent authorizes + captures, then flip
   `PAYMENTS_PROVIDER=stripe`. Live mode is now **unblocked** (LLC + EIN cleared)
   but gate the flip on the checkout UI existing. **Live keys go on Vercel only**
   — the worker doesn't touch Stripe.
3. **Point an uptime monitor** (UptimeRobot/BetterStack) at
   `https://notifeyes.com/api/health` (Phase 2 — endpoint is ready).
**Pooler rule stands:** SSE `LISTEN` + pg-boss on the session pooler (5432);
query pool on the transaction pooler (6543) via `DATABASE_URL_POOLED`.

**Known blockers:** none open. (Most recent, now resolved, kept for the
post-mortem.)
- **`main` CI was RED 2026-05-26 → FIXED + MERGED 2026-05-28 (PR #5; `main` CI now GREEN).**
  The spine Playwright e2e (`tests/spine.spec.ts`) failed: posting a
  shift no longer redirected to `/p/shifts/<id>` — it stayed on
  `/p/shifts/new`. The earlier guess (notification-channel gate vs.
  seed fixtures) was wrong — the action succeeds and the gate passes;
  the seed default `emailOptedIn=true` (`792211a`) didn't help because
  the gate was never the problem. **Actual root cause:** the new reach-
  estimate effect (`previewReach`, added in `12a5f65`) runs a 300ms-
  debounced server action whose `setReach()` re-renders the post-shift
  form. When that re-render lands *during* the success-path
  `router.push`, it aborts the navigation — the destination is fetched
  (`GET /p/shifts/<id> 200`) but the URL never commits. It was
  timing-sensitive: warm the preview resolved before the click and
  committed; **cold (always, in CI) the debounce collided with the
  navigation and it never committed** — which is why the first attempted
  fix passed locally (warm) but CI stayed red. **Fix (two parts, in
  `ShiftForm.tsx`):** (1) move submit/navigation out of the
  `useTransition` action; (2) guard the reach-estimate effect — skip
  while submitting and cancel any in-flight preview so `setReach` can't
  fire mid-navigation. Verified locally with 3/3 *cold* spine runs,
  `tsc` clean. **Merged via PR #5 (commits `f8275c0` + `6954d4c`); the
  `main` CI run on that merge passed — `main` is GREEN as of 2026-05-28.**
  *Lesson:* run the e2e against a **cold** dev server when reproducing —
  `reuseExistingServer` hides cold-only races.

---

## North star

Closed beta in 2–4 weeks. 5–20 hand-picked users from Ross's personal
network. Real money in $1–5 denominations to exercise the full Stripe flow
with minimal exposure. Solo operation (Ross + Claude) — managed services
everywhere, no DIY ops.

---

## The stack

| Concern | Choice |
|---|---|
| Next.js host | Vercel Pro |
| Worker host | Railway |
| Database | Supabase Pro (PostGIS + LISTEN/NOTIFY) |
| Email | Resend |
| SMS | Twilio |
| Payments | Stripe (test → live when LLC clears) |
| File uploads | UploadThing |
| Maps + geocoding | Mapbox |
| Auth | Auth.js v5: password (existing) + Google OAuth |
| Errors | Sentry |
| Product analytics | PostHog |
| Domain | notifeyes.com (GoDaddy) |
| Support email | `support@notifeyes.com` |
| Account email | `rosswmont@notifeyes.com` (Google Workspace) |

Estimated monthly burn at beta scale: **~$66/mo** — Vercel $20 + Railway ~$10
+ Supabase $25 + Twilio ~$5 + Google Workspace $6. Stripe is per-transaction.
Everything else lives in free tiers.

---

## Decisions log

Append-only. Re-opening a decision = add a new entry that supersedes the
old one; do not edit history.

- **2026-05-27** Launch scope: closed beta (5–20 hand-picked users from
  Ross's personal network). Not public, not multi-metro.
- **2026-05-27** Timeline: 2–4 weeks to first real shift.
- **2026-05-27** Team: solo (Ross) + Claude / AI agents.
- **2026-05-27** Budget: $50–300/mo for infra + services.
- **2026-05-27** Hosting: Vercel for Next.js + Railway for the pg-boss
  worker (split deployment). Vercel can't host long-running workers.
  Rejected: Inngest replatform (too risky for the timeline);
  unified-on-Railway (loses Vercel's edge + preview deploys).
- **2026-05-27** Database: Supabase Pro. PostGIS first-class and direct-
  connection LISTEN/NOTIFY works without caveats. Rejected: Neon
  (serverless driver doesn't support LISTEN); Railway PG (fine but worse
  dashboard).
- **2026-05-27** Wire up at beta: all four currently-stubbed services
  (Resend, Twilio, Stripe, UploadThing). No half-measures.
- **2026-05-27** Beta money: real, $1–5 denominations. Exercises full
  Stripe flow with minimal exposure.
- **2026-05-27** Domain: `notifeyes.com` (owned), registered at **GoDaddy**.
  DNS will be managed at GoDaddy by default. If propagation or UI friction
  becomes a problem during Phase 1, fallback is to move nameservers to
  Cloudflare or Vercel DNS while keeping registration at GoDaddy.
- **2026-05-27** Business entity: in progress. Stripe stays in test mode
  until LLC + EIN clear.
- **2026-05-27** Legal: winging it for beta. Mitigation = beta
  participant agreement at `/legal/beta-agreement` with click-through accept.
  Full ToS/Privacy/contract review deferred to before public launch.
- **2026-05-27** License verification: manual admin queue only.
  Verifiable/Medallion integration deferred to V2.
- **2026-05-27** Auth additions: Google OAuth alongside existing
  email+password. Don't remove passwords.
- **2026-05-27** Maps + geocoding: Mapbox. Swap into existing `Geocoder`
  seam (`src/lib/geocode.ts`) + Leaflet tile URL.
- **2026-05-27** Watch-zone alert channels: Email (Resend) + SMS (Twilio).
  Web Push deferred. In-app SSE remains primary.
- **2026-05-27** Beta source: personal network. No paid acquisition.
- **2026-05-27** Observability: Sentry + PostHog (both free tiers cover
  beta scale).
- **2026-05-27** Support: `support@notifeyes.com` forwarded to Ross's
  inbox. No in-app chat widget for beta.
- **2026-05-27** PWA: skipped for beta. Beta users open the URL in mobile
  browser. Native mobile is V2.
- **2026-05-27** SaaS account email: `rosswmont@notifeyes.com` (Google
  Workspace on `notifeyes.com`). Don't sign up under a personal email.
- **2026-05-28** Supabase project `notifeyes-prod` (ref
  `vlmrqsslkxpjwsuvdjue`, us-east-1) provisioned and verified: migrate +
  seed ran clean, PostGIS 3.3.7 + the three GIST spatial indexes confirmed.
- **2026-05-28** `DATABASE_URL` must use the Supabase **session-mode
  pooler (port 5432)** or the direct connection — **never** the
  transaction pooler (6543). The single `pg.Pool` in `src/db/index.ts`
  backs both Drizzle queries and the SSE `LISTEN notification_inserted`;
  transaction pooling doesn't support LISTEN, which would silently break
  the <10s watch-alert SLA. Session pooler is also IPv4-friendly
  (Vercel/Railway); the direct connection is IPv6-only.
- **2026-05-28** Supabase Data API / RLS posture: OPEN, decision pending.
  All 22 public tables have RLS disabled — expected for this app (it talks
  to Postgres via Drizzle as the `postgres` role, not supabase-js /
  PostgREST). But the project's auto-generated Data API + anon key are
  still live, so anyone holding the anon key + project URL could read or
  write every row. Preferred fix: disable the Data API in project settings
  (the app never uses it); alternative: enable RLS on all tables (the
  app's `postgres`-role connection is unaffected). Must settle before any
  anon key could leak — repo is public. Tracked in Risks.
- **2026-05-28** Supabase Data API / RLS — RESOLVED (supersedes the entry
  directly above). The Data API is already **disabled** on `notifeyes-prod`
  (Settings → API: "Enable Data API" unchecked; page reports no schemas can
  be queried), so the anon key exposes nothing and the RLS-off state on the
  22 tables is moot. No action needed; keep the Data API off.
- **2026-05-28** Deploy config: the Railway worker is pinned via
  `railway.json` — `startCommand: npm run worker`, **1 replica** (honors
  the single-worker-per-DB rule), restart on failure, and no Next build on
  that service. `tsx` moved from devDependencies to dependencies so the
  worker's TypeScript runtime is present in prod regardless of `NODE_ENV`
  or install flags. Vercel hosts the Next app (auto-detected, no config
  file). Both services need the **session-pooler** `DATABASE_URL`.
- **2026-05-28** Prod DB connection architecture: split the paths to
  survive serverless against a 60-connection ceiling. The Drizzle **query
  pool** (high churn) routes through the **transaction pooler** via
  `DATABASE_URL_POOLED` (port 6543) — multiplexes many Vercel clients onto
  few Postgres backends; `pg_notify` works there (single statement). The
  SSE `LISTEN` relay uses a separate small **session** pool (`listenPool`)
  on `DATABASE_URL`, and pg-boss stays on `DATABASE_URL` — both need a
  persistent session. Pool maxes lowered (query 5, listen 4). Drove by
  intermittent "A server error occurred" on login when the session pooler
  saturated. The worker (Railway, single process) leaves
  `DATABASE_URL_POOLED` unset → query pool falls back to the session
  connection; its connection count is low and stable. Supersedes the
  earlier "both services need the session pooler" note for the Vercel app's
  query traffic only.
- **2026-05-29** In-app live watch-alert delivery: **client-side polling**,
  not Postgres NOTIFY → SSE. Smoke test surfaced that a shift posted inside an
  OD's watch zone never updated the OD's *open* window live (it only appeared
  on navigation to the Watch list). Root cause: the SSE relay's `LISTEN
  notification_inserted` runs through the Supabase **pooler (Supavisor)**, and
  Supavisor does not forward async `NOTIFY` to a pooled client — the `LISTEN`
  command succeeds (4 idle LISTEN backends confirmed live in `pg_stat_activity`)
  but the notification is dropped on the way back, so the relay never wakes.
  The row still inserts, which is why navigation showed it. Fix:
  `NotificationsLive` now polls a cheap `/api/notifications/unread-count` probe
  every 5s (visibility-gated) and `router.refresh()`es only when the unread
  total rises — robust regardless of pooler/Vercel SSE quirks, comfortably
  inside the <10s SLA at beta scale. SSE is kept wired as an instant fast-path
  (a `notification` event just kicks an immediate poll) for environments where
  NOTIFY delivery works (local dev / a future direct connection). Also bounded
  the SSE stream lifetime to 10 min in the relay: on Vercel the request-abort
  doesn't reliably fire on browser disconnect, so LISTEN connections were
  leaking and capping the max-4 `listenPool` (idle backends seen lingering for
  hours). **Deferred:** true direct-connection SSE (instant push without
  polling) needs the Supabase **IPv4 add-on (~$4/mo)** because the direct
  Postgres endpoint is IPv6-only and Vercel/Railway are IPv4 — revisit
  post-beta if the polling cadence isn't snappy enough. Email + SMS remain the
  authoritative <10s alert channels regardless.
- **2026-05-29** Integration wiring: **pre-wire the code now, env-gated, ahead
  of the SaaS signups**, as separate stacked PRs (each dormant until its keys
  are set, so prod behavior is unchanged until activation). Landed three:
  **#10 Mapbox** (geocode + tiles; `MAPBOX_TOKEN` server / `NEXT_PUBLIC_MAPBOX_TOKEN`
  client; falls back to Nominatim + OSM), **#11 Google OAuth**, **#12 Twilio
  SMS** (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`;
  un-stubs the SMS seam per the locked beta decision). Resend + UploadThing
  needed no code (already key-gated). No new deps in any of the three. Env-var
  names live in the PR descriptions + `.env.example`.
- **2026-05-29** Google OAuth = **existing accounts only**. Sign-in matches a
  *verified* Google email to an existing `users` row; unknown emails are
  denied (no auto-provisioning — new users go through the OD/practice signup
  flow, which collects role-specific onboarding Google can't supply). JWT
  session (no DB adapter), so the `jwt` callback enriches the token from our
  `users` row on OAuth sign-in. Easy to revisit if Google should create
  accounts later.
- **2026-05-29** Sentry + PostHog: **deferred until those accounts exist.**
  Unlike the other seams they need new deps (`@sentry/nextjs`, `posthog-js`) +
  a `next.config` wrapper + instrumentation (build-affecting for everyone), and
  observability is best verified live (do events land? source maps upload?).
  Wire + verify in one pass once the DSN/key are in hand, rather than blind.
- **2026-05-30** Integration adapters **merged to `main` + deployed**: #10
  Mapbox (geocode + tiles), #14 Google OAuth, #12 Twilio SMS. All env-gated
  with fallbacks (Mapbox → Nominatim/OSM, Google button hidden when unset,
  Twilio → console stub). Prod verified: `notifeyes.com` 200, `/login` shows
  the Google button (env-gate live), `main` CI green, local `tsc` +
  `next build` clean. SaaS accounts created and keys set (Resend, UploadThing,
  Mapbox, Google Cloud, Sentry, PostHog, Stripe test); domain attached with
  `AUTH_URL`; Resend DNS verified.
- **2026-05-30** Merge mechanics (lesson): #11 was **auto-closed**, not
  retargeted, when #10 merged with `--delete-branch` removed its base branch
  `claude/wire-mapbox`. GitHub can't reopen a PR whose base is gone, so #11
  was re-cut as **#14** from the same `claude/wire-google` branch → `main`.
  Rule for stacked PRs: merge the lower one **without** `--delete-branch` (or
  `gh pr edit --base main` the dependent first), then delete branches at the
  end.
- **2026-05-30** Sentry / PostHog / real Stripe: keys are set in Vercel but
  **no code is wired** (confirmed: no `@sentry/nextjs` / `posthog-js` /
  `stripe` deps; `payments/index.ts` still hard-wires the stub). Setting the
  env vars did **not** activate these — they remain the open Phase 1 work.
  Wire + verify live before checking their boxes.
- **2026-05-30** Stripe **test-mode** keys + webhook secret were **rotated
  after a brief exposure** and Vercel redeployed. Test-mode only (no live
  funds at risk); logged for the record and as a reminder to keep the
  pre-public secret audit (Risks tracker) on the list before live keys.
- **2026-05-30** Lint: the repo has **no working lint step** — Next.js 16
  removed `next lint`, there is no `eslint` dependency, and no ESLint config;
  the `"lint": "next lint"` script is vestigial (CI never ran it). Either set
  up an ESLint flat config (`eslint.config.mjs`) or drop the dead script —
  deferred, tracked here.
- **2026-05-30** Deferred integrations wired as **3 independent sequential
  PRs** (not a stack — stacking bought nothing but the #11 auto-close pain):
  **#16 Sentry** (`@sentry/nextjs` v10; `withSentryConfig` wraps only when a
  DSN is set; instrumentation + server/edge/client configs gated on DSN,
  prod-only send) and **#17 PostHog** (`posthog-js` client provider in the root
  layout; gated on `NEXT_PUBLIC_POSTHOG_KEY`+`HOST`, prod-only; manual App
  Router `$pageview` + autocapture) — both **merged + deployed**. Each verified
  by building twice (with + without the integration's env). Live dashboard
  verification is Ross's (can't be done headless).
- **2026-05-30** Stripe scope decision: **foundational adapter only**, not a
  full checkout (chosen over full Payment Element checkout / defer). PR **#18
  open + HELD for review** (the money/spine change): `src/lib/payments/stripe.ts`
  (real `PaymentProvider` via the `stripe` SDK) + signature-verified
  `/api/payments/webhook`, selected by a new **`PAYMENTS_PROVIDER`** env flag
  (default `"stub"`). Rationale for the flag vs. key-presence gating:
  `STRIPE_SECRET_KEY` is **already in prod**, so key-presence gating would flip
  prod onto a half-built flow the instant it deployed. With the flag default
  `"stub"`, merging #18 changes nothing. Known limit: no card-collection UI, so
  a real intent stays at `requires_payment_method` until a Payment Element step
  (deliberate follow-up) authorizes it. Live mode is blocked on the LLC anyway.
- **2026-05-30** Sentry + PostHog **verified live on prod** (Ross): Sentry
  captured a test exception with a source-mapped (un-minified) stack via the
  temporary `/api/debug-sentry` route, and PostHog logged pageview + autocapture
  events. The debug route (#20) was then **removed**. Both observability seams
  are now done; only the Stripe checkout follow-up remains of the integration
  work.
- **2026-05-30** Stripe **#18 reviewed + merged** (self-review: signature-
  verified webhook, idempotent reconciliation, all payment callers already
  try/catch-wrapped → graceful failure; nits noted — no webhook event dedup,
  unpinned `apiVersion` — left for the checkout follow-up). Merge verified inert
  in prod (homepage 200, webhook 400 on unsigned POST, stub still active).
- **2026-05-30** Deployed-system verification (what's checkable headless):
  prod route surface healthy (public 200, auth-gated 302→login, no 500s); worker
  **boot-safety** confirmed by code review — no job imports `@/lib/payments`, so
  #18 didn't add the Stripe SDK to the worker's deps; Sentry/PostHog are
  Next-only; only `env.ts`/`sms.ts` reached the worker, both boot-safe. **Not**
  headless-checkable, left to Ross: the worker actually *running* on Railway
  (logs) and an e2e smoke with a real email (seeded `@notifeyes.dev` addresses
  deliberately avoided — bounces would hurt Resend's sender reputation).
- **2026-05-30** Shipped **`/api/health` (#23)** — DB `SELECT 1` + pg-boss
  liveness (queue depth + last-completed-job; "alive" if a job completed within
  15 min, since crons fire every 5). Built to close the worker-verification gap
  (liveness was only checkable via Railway logs). On first prod hit it returned
  `status: ok` with the **worker confirmed RUNNING** (last job ~3 min prior, DB
  44ms) — so the "Deploy worker to Railway" box is now ticked on hard evidence.
  Endpoint is monitor-ready (503 on DB-down); pointing UptimeRobot/BetterStack
  at it is the remaining half of the Phase-2 health box.
- **2026-05-30** **LLC cleared + EIN received** — supersedes the 2026-05-27
  "Stripe stays in test mode until LLC + EIN clear" decision. Stripe is now
  live-capable. Business bank account still in progress (this week). **Still
  gating real charges:** there's no Payment Element checkout yet, so live keys +
  `PAYMENTS_PROVIDER=stripe` would record unpaid `requires_payment_method`
  intents — flip to live only after the checkout UI lands. Live keys go on
  **Vercel only** (the worker doesn't import payments).
- **2026-05-30** **Phase-1 e2e alert smoke PASSED in prod** (Ross): real OD →
  Bay Area watch zone → shift posted by the seeded practice → OD got the in-app
  notification **and** a real Resend email. Railway worker confirmed online
  (8 queues; session-pooler `DATABASE_URL`, `AUTH_SECRET` present). Only the SMS
  leg is unproven (Twilio pending).
- **2026-05-30** Worker session-pool hardening: a transient `EMAXCONNSESSION`
  (Supavisor session `pool_size: 15`) hit on worker startup and self-recovered.
  Root cause: pg-boss's default pool (pg default **10**) + the Drizzle query pool
  (max **5**, on the session pooler in the worker since `DATABASE_URL_POOLED` is
  unset) = 15, exactly the cap — and it's shared with Vercel's SSE `listenPool`
  (max 4). Fixed by capping pg-boss at `max: 5` in `boss.ts` (worker footprint
  → 5 + 5 = 10, leaving headroom). Complementary lever if it recurs: raise the
  Supavisor session `pool_size` (room under `max_connections=60`).
- **2026-05-31** **Money model pivot — FEE-ONLY (matchmaker).** Supersedes the
  current money-through model (and the brief's OD-payout-via-subtotal +
  cancellation-%-of-wage assumptions) for beta. NotifEyes charges only its **$10
  match fee**; the practice pays the OD's wage **directly** (check / direct
  deposit / Venmo / Zelle). Platform never holds wages → no Stripe Connect for
  beta (Connect = the production "guaranteed pay" upgrade). The fee is authorized
  at booking and **captured only when the practice confirms the OD showed up** (a
  new "Did the doctor show?" prompt replaces OD check-in/out); no-show ⇒ no fee.
  Cancellation = **reputation-only, no platform charge** (the prior %-of-wage fee
  can't work once the platform never holds the wage). Practice card collected
  **just-in-time at first booking** for the $10. Full UX roadmap lives in
  `~/.claude/plans/concurrent-doodling-koala.md`. This work is **off the
  launch-plan cursor — a side quest**; no Phase boxes get ticked for it.
- **2026-06-03** Money-model overhaul **roadmap moved in-repo** →
  [`docs/money-model-overhaul.md`](money-model-overhaul.md) — supersedes the
  machine-local `~/.claude/plans/` reference above so the plan travels via git.
  Status: **Phases A–C merged** to `main` (PRs #26 / #27 / #28: fee-only pivot,
  activation, match→book loop). **A3 (Stripe card capture) is deferred; Phases
  D/E are next.** Still a side quest — no Phase boxes ticked.
- **2026-06-10** **A3 (Stripe card capture) merged — PR #32**, completing the
  money-model overhaul's payments work (only Phase E remains). Save-once /
  off-session model: the practice saves a card via a SetupIntent (`off_session`);
  each booking authorizes the **$10 hold off_session**; captured at attendance
  confirm. Verified end-to-end on the Vercel preview (test mode). **Inert in
  prod:** `PAYMENTS_PROVIDER` stays `stub` and the Production-scope Stripe keys
  aren't set, so prod is unchanged. Migration `0005` (practices
  `stripe_customer_id` + `default_payment_method_id`) confirmed applied to
  `notifeyes-prod`. Still a side quest — **no launch-plan boxes ticked**: the
  "Replace Stripe stub" + Stripe-smoke boxes tick only on the live flag flip.
  Go-live is now ops-only (set Production keys + flip the flag; live keys gated
  on the business bank account).
- **2026-06-10** **Match fee = flat $10 (decision, settled in conversation).**
  One flat **$10** everywhere, replacing the prior `$9.99` regular / `$19.99`
  same-day defaults; the **same-day/urgent premium is removed** (one price
  regardless of timing). Shipped in PR #32: `env.ts` defaults
  (`NOTIFEYES_MATCH_FEE_CENTS` + `NOTIFEYES_SAMEDAY_FEE_CENTS` → `1000`),
  `.env.example`, the `MARKETING_MATCH_FEE_DISPLAY` constant (dropped the now-
  redundant `MARKETING_SAMEDAY_DISPLAY`), and all marketing/legal copy (home,
  /pricing, /for-practices, /for-optometrists, /help, /about, legal Terms).
  Existing bookings keep their snapshotted fee (historical accuracy). This
  clarifies the 2026-05-31 pivot's "$10 match fee" — the code had drifted to
  $9.99. The `NOTIFEYES_*_FEE_CENTS` env vars aren't set in prod, so the new
  default applies on deploy. `--TODO: legal review` markers on the final amount
  remain.

---

## Phase 1 — Plumbing (target: end of week 1)

### Out-of-band tasks (Ross)
- [x] File LLC + obtain EIN (or accelerate via Stripe Atlas). _LLC cleared +
      EIN received 2026-05-30; Stripe is now live-capable. Business bank account
      in progress (this week) — doesn't block anything technical._
- [x] Set up Google Workspace for `notifeyes.com`. Create
      `rosswmont@notifeyes.com` and `support@notifeyes.com`.
- [ ] Sign up for SaaS accounts using `rosswmont@notifeyes.com`:
  - [x] Vercel (Pro tier)
  - [x] Railway
  - [x] Supabase (Pro tier)
  - [x] Resend — domain verified (DKIM/SPF/DMARC)
  - [ ] Twilio (purchase one US phone number) — _compliance profile under
        review; no number yet_
  - [x] Stripe — **live-capable** (LLC + EIN cleared 2026-05-30). Test keys set;
        live keys go on **Vercel only** when the Payment Element checkout lands.
  - [x] UploadThing
  - [x] Mapbox
  - [x] Sentry — keys set + code wired (#16)
  - [x] PostHog — keys set + code wired (#17)
  - [x] Google Cloud Console (OAuth credentials)

### Code + config (Claude)
- [x] Provision Supabase project (`notifeyes-prod`, ref
      `vlmrqsslkxpjwsuvdjue`, us-east-1). Run migrations + seed. Verify
      PostGIS + LISTEN/NOTIFY against the cloud DB. _Done 2026-05-28:
      PostGIS 3.3.7, `geography(Point,4326)` columns, all 3 GIST indexes,
      `ST_DWithin`, and `pg_notify` confirmed; seed loaded (30 shifts / 20
      ODs / 5 practices / 28 users). LISTEN sender verified; the receiver
      round-trip is config-gated on `DATABASE_URL` connection mode (see
      Cursor) and gets its final end-to-end proof in the post-deploy smoke
      test._
- [x] Deploy Next.js to Vercel. _Done 2026-05-28; `notifeyes.com` attached +
      `AUTH_URL=https://notifeyes.com` set + redeployed 2026-05-30. Homepage
      200, login verified._
- [x] Deploy worker to Railway (same repo, separate service). _Confirmed
      **running** 2026-05-30 via `/api/health`: pg-boss reported a job completed
      ~3 min before the probe (queued 1, active 0) — the worker is deployed and
      actively processing. (Stronger than a startup log line.)_
- [x] Wire Resend into `src/lib/notifications/channels/email.ts`. _Code was
      key-gated; key set + `notifeyes.com` DKIM/SPF/DMARC verified 2026-05-30._
- [x] Wire Twilio into `src/lib/notifications/channels/sms.ts`. _Merged #12,
      env-gated; **dormant on the console stub** until Twilio compliance
      clears + a number is bought + the 3 `TWILIO_*` vars are set._
- [ ] Replace Stripe stub (`src/lib/payments/stub.ts`) with real
      (test-mode) PaymentIntent calls. _Foundational adapter + webhook **merged
      (PR #18)**, flag-gated behind `PAYMENTS_PROVIDER` (default stub) — verified
      inert in prod. Box stays unchecked until the Payment Element checkout step
      lands + the flag is flipped to `stripe`._
- [x] Set `UPLOADTHING_TOKEN` in Vercel env (un-stubs uploads). _Set
      2026-05-30; the worker doesn't upload, so Railway doesn't need it._
- [x] Swap Nominatim for Mapbox in `src/lib/geocode.ts` + Leaflet tile URL.
      _Merged #10; `MAPBOX_TOKEN` + `NEXT_PUBLIC_MAPBOX_TOKEN` set._
- [x] Add Google OAuth provider to `src/lib/auth/config.ts`. _Merged #14;
      existing-accounts-only; verified live (button on `/login`)._
- [x] Wire Sentry + PostHog SDKs. Configure source maps on Vercel build.
      _Sentry #16 (`withSentryConfig` + instrumentation, source maps on the
      prod build) + PostHog #17 (client provider, App Router pageviews), both
      merged + deployed, env-gated. **Verified live 2026-05-30** (Sentry capture
      + source-mapped stacks; PostHog pageview/autocapture)._
- [ ] End-to-end smoke: sign up as OD → draw watch zone → post shift as
      practice → alert lands via SSE + email + SMS within 10s. _**In-app + email
      PASSED in prod 2026-05-30** (real OD → Bay Area zone → seeded-practice
      shift → in-app notification + real Resend email from
      notifications@notifeyes.com). Box ticks once the **SMS leg** runs (blocked
      on Twilio activation)._

---

## Phase 2 — Hardening (target: end of week 2)

### Out-of-band tasks (Ross)
- [ ] LLC + EIN finalize. Update Stripe with real entity info, switch to
      live keys.
- [ ] Recruit 3–5 beta users (ODs and practices). Coffee chats, soft
      commitments.

### Code + config (Claude)
- [ ] Draft `/legal/beta-agreement` page with click-through accept and
      "beta, things change, no recourse for changes made before exit-of-
      beta" language.
- [ ] Verify Supabase backup + PITR by restoring to a fresh project.
- [ ] `/api/health` endpoint + UptimeRobot or BetterStack monitor. _Endpoint
      **shipped (#23)** — reports DB + pg-boss worker liveness; returns 503 when
      the DB is down. Just needs an external monitor pointed at it to tick._
- [ ] Worker health: surface pg-boss queue depth + last-job-completed
      timestamp.
- [ ] Address every `--TODO: legal review` marker in the codebase.
      Resolve or wrap in feature flag so beta doesn't hit unresolved
      decisions.
- [ ] Tighten worker logging to JSON for Railway log search.
- [ ] CI runs against a Supabase branch DB (Pro tier supports this).

---

## Phase 3 — Beta onboarding (target: end of week 3)

- [ ] Manual practice + OD records for the first cohort (or guide live
      signups).
- [ ] Manual license verification of beta ODs via the admin queue.
- [ ] First real shift posted with $1–5 denomination, watched live.
- [ ] 48h support window per new user — Ross on-call.

---

## Phase 4 — Buffer (week 4)

Reserved for iteration on real beta feedback. Floats deliberately. Every
previous step has slipped at least once on every project ever — use it.

---

## Out of scope (explicitly deferred)

- Stripe Connect / real OD payouts → V2.
- Verifiable/Medallion auto license verification → V2.
- Web Push notifications → after beta.
- PWA polish (manifest, offline shell, add-to-home) → after beta.
- Native mobile → V2.
- Multi-metro → V2. `NOTIFEYES_LAUNCH_METRO` stays pinned to SF Bay.
- Real legal review of ToS/Privacy/contract body → before public launch,
  not before beta.

---

## Open questions

- **LLC formation timeline.** Affects when Stripe can flip to live mode.
- **Beta cohort list.** Names needed by start of Phase 3.

---

## External accounts inventory

Bookkeeping only — no credentials in this file. Creds live in Ross's
password manager. The Vercel + Railway dashboards hold the production
env vars.

| Service | Tier | Account email | Status |
|---|---|---|---|
| Google Workspace | Business Starter | rosswmont@notifeyes.com | active |
| Vercel | Pro | rosswmont@notifeyes.com | active |
| Railway | Hobby | rosswmont@notifeyes.com | active |
| Supabase | Pro | rosswmont@notifeyes.com | active (project `notifeyes-prod`) |
| Resend | Free | rosswmont@notifeyes.com | active (domain verified) |
| Twilio | Pay-as-you-go | rosswmont@notifeyes.com | compliance under review (no number yet) |
| Stripe | Standard | rosswmont@notifeyes.com | active (test mode; keys not yet wired) |
| UploadThing | Free | rosswmont@notifeyes.com | active |
| Mapbox | Free | rosswmont@notifeyes.com | active |
| Sentry | Developer (free) | rosswmont@notifeyes.com | active (wired #16; verified live) |
| PostHog | Free | rosswmont@notifeyes.com | active (wired #17; verified live) |
| Google Cloud (OAuth) | Free | rosswmont@notifeyes.com | active |

---

## Risks tracker

| Risk | Status | Mitigation |
|---|---|---|
| **main CI red — spine e2e regression (post-shift navigation)** | RESOLVED 2026-05-28 (PR #5 merged, `main` green) | Cold-only race: the new reach-estimate effect's `setReach` aborted the post-shift `router.push`. Fixed in `ShiftForm.tsx` (move nav out of `useTransition` + guard the effect during submit). See Known blockers. |
| **Supabase Data API exposes all rows (RLS off, anon key live)** | RESOLVED 2026-05-28 | Data API is disabled on `notifeyes-prod` (no schemas queryable), so the anon key exposes nothing — RLS-off on the 22 tables is moot. App connects via Drizzle as `postgres`, unaffected. Keep the Data API off. |
| LLC delay blocks Stripe live mode | open | Stripe test mode in parallel; switch keys when ready |
| Email deliverability (DKIM not propagated) | open | DKIM/SPF/DMARC on day 1 of Phase 1; verify via mail-tester.com |
| Repo is public, secrets risk | open | Audit before Phase 1 commits; consider going private |
| `--TODO: legal review` markers ship live | open | Inventory at start of Phase 2; resolve or feature-flag each |
| Sentry/PostHog leak PII | open | Audit `beforeSend` + autocapture config during Phase 1 wiring |
| Worker on Railway killed → jobs stuck | open | pg-boss is resilient (jobs persist in PG); set Railway healthcheck to restart |
| Beta user disputes a $5 charge with no legal docs | open | Beta participant agreement + instant-refund policy |
| Vercel serverless caps SSE connection duration → reconnect gaps in the <10s alert | mitigated 2026-05-29 | In-app live updates no longer depend on the held-open SSE stream — `NotificationsLive` polls `/api/notifications/unread-count` every 5s (see Decisions log). SSE relay lifetime now bounded to 10 min so leaked `LISTEN` connections recycle. `EventSource` still auto-reconnects as a fast-path. |
| **Supabase pooler drops async NOTIFY → SSE relay never wakes** | mitigated 2026-05-29 | `LISTEN/NOTIFY` doesn't propagate through Supavisor to the relay's pooled connection, so the in-app live alert silently never arrived. Switched to client-side polling (Decisions log 2026-05-29). True direct-connection SSE deferred — needs the Supabase IPv4 add-on (direct endpoint is IPv6-only). |
| **Prod DB connection exhaustion (session pooler, max_connections=60)** | RESOLVED 2026-05-28 (verified live) | Intermittent "A server error occurred" on login. Split pools shipped (PR #7): query pool → transaction pooler (`DATABASE_URL_POOLED`:6543), dedicated session pool for SSE, pg-boss unchanged. `DATABASE_URL_POOLED` set on Vercel + redeployed; logins stable under churn. Watch `pg_stat_activity` as users grow; bump compute if needed. |
| **Worker `EMAXCONNSESSION` (Supavisor session `pool_size: 15`)** | mitigated 2026-05-30 | Transient on worker startup, self-recovered. pg-boss default pool (10) + Drizzle pool (5) = 15 = the cap, shared with Vercel's SSE `listenPool` (4). Capped pg-boss at `max: 5` in `boss.ts` (footprint → 10). Monitor `/api/health` + Railway logs; if it recurs, raise the Supavisor session `pool_size` (headroom under `max_connections=60`). |
