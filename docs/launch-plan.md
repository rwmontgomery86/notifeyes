# Beta launch plan

> **How to use this file.** This is the persistent cross-session source of
> truth for the closed-beta workstream. The cursor below is the bookmark —
> on a fresh session or a fresh machine, read it first to know where to
> resume. When work lands, the commit that lands it must also tick the
> checkbox here and bump `Last touched`.

**Last touched:** 2026-05-27 (initial bootstrap)
**Cursor:** Phase 1 — waiting on Ross to complete out-of-band signups
(LLC, Google Workspace, SaaS accounts). First Claude-actionable step:
provision Supabase project once credentials are in hand.

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
| Domain | notifeyes.com (registrar TBD) |
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
- **2026-05-27** Domain: `notifeyes.com` (owned). Registrar still to
  confirm (Namecheap/GoDaddy/Google Domains category).
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

---

## Phase 1 — Plumbing (target: end of week 1)

### Out-of-band tasks (Ross)
- [ ] File LLC + obtain EIN (or accelerate via Stripe Atlas).
- [ ] Set up Google Workspace for `notifeyes.com`. Create
      `rosswmont@notifeyes.com` and `support@notifeyes.com`.
- [ ] Sign up for SaaS accounts using `rosswmont@notifeyes.com`:
  - [ ] Vercel (Pro tier)
  - [ ] Railway
  - [ ] Supabase (Pro tier)
  - [ ] Resend
  - [ ] Twilio (purchase one US phone number)
  - [ ] Stripe (test mode for now)
  - [ ] UploadThing
  - [ ] Mapbox
  - [ ] Sentry
  - [ ] PostHog
  - [ ] Google Cloud Console (OAuth credentials)

### Code + config (Claude)
- [ ] Provision Supabase project. Run migrations + seed. Verify PostGIS +
      LISTEN/NOTIFY work end-to-end against the cloud DB.
- [ ] Deploy Next.js to Vercel. Attach `notifeyes.com`.
- [ ] Deploy worker to Railway (same repo, separate service).
- [ ] Wire Resend into `src/lib/notifications/channels/email.ts`. Add
      DKIM/SPF/DMARC records to `notifeyes.com` DNS.
- [ ] Wire Twilio into `src/lib/notifications/channels/sms.ts`.
- [ ] Replace Stripe stub (`src/lib/payments/stub.ts`) with real
      (test-mode) PaymentIntent calls.
- [ ] Set `UPLOADTHING_TOKEN` in Vercel + Railway env (un-stubs uploads).
- [ ] Swap Nominatim for Mapbox in `src/lib/geocode.ts`. Swap Leaflet
      tile URL to Mapbox.
- [ ] Add Google OAuth provider to `src/lib/auth/config.ts`.
- [ ] Wire Sentry + PostHog SDKs. Configure source maps on Vercel build.
- [ ] End-to-end smoke: sign up as OD → draw watch zone → post shift as
      practice → alert lands via SSE + email + SMS within 10s.

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
- [ ] `/api/health` endpoint + UptimeRobot or BetterStack monitor.
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
- **Domain registrar.** Needed before Vercel DNS step in Phase 1.

---

## External accounts inventory

Bookkeeping only — no credentials in this file. Creds live in Ross's
password manager. The Vercel + Railway dashboards hold the production
env vars.

| Service | Tier | Account email | Status |
|---|---|---|---|
| Google Workspace | Business Starter | rosswmont@notifeyes.com | not signed up |
| Vercel | Pro | rosswmont@notifeyes.com | not signed up |
| Railway | Hobby | rosswmont@notifeyes.com | not signed up |
| Supabase | Pro | rosswmont@notifeyes.com | not signed up |
| Resend | Free | rosswmont@notifeyes.com | not signed up |
| Twilio | Pay-as-you-go | rosswmont@notifeyes.com | not signed up |
| Stripe | Standard | rosswmont@notifeyes.com | not signed up |
| UploadThing | Free | rosswmont@notifeyes.com | not signed up |
| Mapbox | Free | rosswmont@notifeyes.com | not signed up |
| Sentry | Developer (free) | rosswmont@notifeyes.com | not signed up |
| PostHog | Free | rosswmont@notifeyes.com | not signed up |
| Google Cloud (OAuth) | Free | rosswmont@notifeyes.com | not signed up |

---

## Risks tracker

| Risk | Status | Mitigation |
|---|---|---|
| LLC delay blocks Stripe live mode | open | Stripe test mode in parallel; switch keys when ready |
| Email deliverability (DKIM not propagated) | open | DKIM/SPF/DMARC on day 1 of Phase 1; verify via mail-tester.com |
| Repo is public, secrets risk | open | Audit before Phase 1 commits; consider going private |
| `--TODO: legal review` markers ship live | open | Inventory at start of Phase 2; resolve or feature-flag each |
| Sentry/PostHog leak PII | open | Audit `beforeSend` + autocapture config during Phase 1 wiring |
| Worker on Railway killed → jobs stuck | open | pg-boss is resilient (jobs persist in PG); set Railway healthcheck to restart |
| Beta user disputes a $5 charge with no legal docs | open | Beta participant agreement + instant-refund policy |
