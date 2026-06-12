# Money-model overhaul + beta UX (fee-only pivot)

> Durable, in-repo source of truth for the **fee-only money-model pivot** and the
> beta UX overhaul. The original plan lived in a machine-local `~/.claude/plans/`
> file; this copy is committed so the work can be resumed from **any machine**.
> This is a parallel workstream to [`docs/launch-plan.md`](launch-plan.md) — a
> deliberate "side quest", so **no launch-plan checkboxes are ticked for it**
> (the pivot decision is logged in the launch plan's Decisions log, 2026-05-31).

**Status:** Phases A–D **and A3 merged to `main`** (A3 = PR #32). A3 is live in
the codebase but **inert in prod** — `PAYMENTS_PROVIDER` stays `stub` and the
Production-scope Stripe keys aren't set, so prod behavior is unchanged until the
flag is flipped (go-live). Only **Phase E** remains unstarted — and it is **ON
HOLD as of 2026-06-12**, along with the A3 go-live flip: the first beta cohort
won't be charged (launch-plan Decisions log 2026-06-12), so the stub stays and
the money-clarity polish waits until charging actually turns on.
**Last touched:** 2026-06-12 — **Phase E + A3 go-live put on hold** (first
cohort runs free; settled in conversation, logged in the launch-plan Decisions
log). Also: migration `0005`'s missing drizzle-ledger row was discovered and
backfilled on prod (it had been applied by hand on 2026-06-10 — see the
launch-plan 2026-06-12 incident entry). Prior update 2026-06-10: **A3 merged
(PR #32)** and verified end-to-end on the Vercel preview (card saved via
SetupIntent → $10 off_session hold → captured at attendance confirm), plus the
Add-card form close fix, the **flat $10 fee** (same-day premium removed), and
an attendance-copy spacing fix. `main` CI green; prod on the stub.
**Cursor:** **ON HOLD.** Resume when the first-cohort-free period ends: pick up
**A3 go-live** (ops-only: Production-scope Stripe keys incl.
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, flip `PAYMENTS_PROVIDER=stripe`, test
mode first; **live keys gated on the business bank account**), then **Phase E**
— money clarity & trust polish; its remaining scope is in the carry-over notes
below.

> **Stacked PRs (done):** D4 (`claude/phase-d4-status-pings`) branched off
> `claude/phase-d-concierge` for the `conciergeOptedIn` flag. Merged in order —
> **#30 first, then #31** — per the 2026-05-30 stacked-PR lesson in the launch-plan
> Decisions log.

## How to resume (e.g. on the other Mac)

1. `git pull` on `main` — Phases A–C are already landed there.
2. Read this file top-to-bottom, then the **Status** table for what's done / next.
3. Work each phase (or remaining item) as **its own PR off `main`**, branch
   `claude/<phase>-<slug>`. Verify with `npx tsc --noEmit` then `next build` with
   CI env (see `.github/workflows/ci.yml` for the exact env block); push, watch CI
   to green (build **and** the Playwright spine e2e), then merge.
4. Seeded dev creds + verify steps live in `CLAUDE.md`. The spine e2e
   (`tests/spine.spec.ts`) asserts on user-visible copy — if you change apply /
   booking / button text, update its assertions in the same PR (this bit us once).

## Status

| Phase | Item | State | PR |
|---|---|---|---|
| A | A1 — fee-only charge ($10) + fee-only money display | ✅ merged | #26 |
| A | A2 — "Did the doctor show?" attendance confirm → fee capture | ✅ merged | #26 |
| A | **A3 — Stripe Payment Element card capture (+ flip `PAYMENTS_PROVIDER=stripe`)** | ✅ **merged** (inert; flag held at `stub`) | #32 |
| A | A4 — reputation-only cancellation + no-show fee release | ✅ merged | #26 |
| B | B1 — email alerts ON by default at signup (OD + practice) | ✅ merged | #27 |
| B | B2 — OD setup home usable while pending + earlier guidance | ✅ merged | #27 |
| B | B3 — one-tap "Watch the Bay Area" watch zone | ✅ merged | #27 |
| B | B4 — practice activation (geocode copy + reach honesty + dashboard guidance) | ✅ merged | #27 |
| C | C1 — email = hero channel (rich HTML + one-tap "View & apply") | ✅ merged | #28 |
| C | C2 — in-app toast on a new match | ✅ merged | #28 |
| C | C3 — OD withdraw + apply receipt | ✅ merged | #28 |
| C | C4 — invite-accept payment-limbo messaging | ✅ merged | #28 |
| C | C5 — practice polish (decline confirm, dedupe Book, "Boost reach") | ✅ merged | #28 |
| D | D1 — concierge preference model + opt-in toggle (OD + practice) | ✅ merged | #30 |
| D | D2 — morning-of reminder w/ practice address (new worker job, OD) | ✅ merged | #30 |
| D | D3 — .ics calendar invite on booking-confirmed (OD + practice) | ✅ merged | #30 |
| D | D4 — status pings: OD shortlisted / passed / filled-elsewhere + practice no-applicants nudge | ✅ merged | #31 |
| E | Money clarity & trust polish | ⏸ **on hold 2026-06-12** (first cohort not charged) | — |

**Carry-over notes for the next session:**
- **2026-06-12 QA sweep shrank Phase E's scope.** A full-app QA batch (see
  launch-plan Decisions log 2026-06-12) aligned everything *copy* with
  fee-only: marketing/legal pages, the **contract body (v0.2-stub** — wage paid
  directly, fee captures on attendance, reputation-only cancellation**)**, the
  booking payment panel (now shows "Match fee captured" post-confirm), the
  admin payouts page (reframed "Wage tracking"), and deleted the same-day fee
  env vars/labels. What's left for Phase E proper: the no-show card's
  "this looks wrong? / reliability standing" treatment + any fuller role-aware
  money breakdown beyond what the booking page now shows.
- **Phase D landed "focused" scope:** the preference model + concierge toggle,
  the morning-of reminder, and the .ics invite. The roadmap's three "new key
  moments" (shift-tomorrow, "did the doctor show?", payout/wage sent) **already
  existed** as notifications (shift-reminders / booking-completed-followups /
  admin payouts) — no new work was needed there. **"Status pings" (D4) now built
  separately** on `claude/phase-d4-status-pings` (stacked on #30).
- **D4 status pings (4, all concierge-gated, all reuse instant/worker paths):**
  OD *shortlisted* + OD *passed* fire from the practice `setApplicationStatus`
  action; OD *shift-filled-elsewhere* fires from both booking paths (capturing
  the auto-declined applicants via `.returning()` on the bulk decline); the
  practice *no-applicants nudge* is a new hourly worker (`shift-unfilled-nudge`,
  shifts 2–24h out with zero applications). Two new kinds — `application_update`
  (the 3 OD pings) + `shift_unfilled` — added to the union and both KIND_LABELS
  display maps (which have safe `?? kind` fallbacks).
- **Concierge gating is producer-side:** new `conciergeOptedIn` flag on `users`
  (default off; migration `0004`). `dispatchNotification`'s default key-moment
  gating is unchanged — call sites check the flag before sending extras. The
  morning-of reminder reuses the existing `shift_reminder` kind with
  `payload.window = "morning_of"` so the in-app inbox / live-toast display needs
  no new mapping.
- **.ics is concierge-gated, both sides.** The OD gets it on the practice-books
  path always (email already sent there); on the invite-accept path the OD only
  gets a confirmation email *at all* when concierge is on (avoids noise on a
  self-accept). The practice gets the .ics on its booking_confirmed email when
  opted in. Email-attachment plumbing was added to the Resend channel
  (base64); push/sms ignore attachments.
- **A3 is now BUILT (test-mode; flag held).** Architecture: the practice saves a
  card **once** via a Stripe **SetupIntent** (`usage: off_session`); every booking
  then authorizes the $10 hold **off_session** against the saved customer + payment
  method (no client step). Card UI lives on **`/p/billing`** (`AddCardForm`, real
  `<PaymentElement>` when keys are set, else a "connect Stripe" placeholder) with a
  **just-in-time gate** that blocks a first booking until a card is on file (gate is
  dormant under the stub). New `practices` columns `stripe_customer_id` +
  `default_payment_method_id` (migration `0005`); webhook handles
  `setup_intent.succeeded`. **Two switches keep prod inert:** the
  `PAYMENTS_PROVIDER` flag stays `stub`, and card collection only activates when
  **both** Stripe keys (secret + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) are set.
  Unblocks C4's *real* charge and the launch plan's "real Stripe checkout."
  **Remaining (Ross-owned):** drop the test keys in, run the manual card smoke,
  flip `PAYMENTS_PROVIDER=stripe` (live keys after the bank account).
- **C4 shipped the display half only** — the booking page now surfaces the fee state calmly ("booking confirmed; $10 captured at attendance"); actually collecting/authorizing the card waits on A3.
- **C5** intentionally **skipped** the roadmap's "label the scope toggle" item — the OD `/d/shifts` toggle was already clearly labeled ("My state" / "My watch zones").
- **Decline is terminal** in the application state machine, so C5 added a *confirm* step (no undo is possible).

---

## Context

The beta is plumbing-complete (`docs/launch-plan.md`) but the *experience* hadn't
been reviewed. Goal: both sides feel smooth and proactive before onboarding 5–20
hand-picked users. The review surfaced (a) a foundational money-model decision
that simplifies the whole payment story for beta, and (b) activation / clarity /
proactivity fixes on both sides. Beta entry is real self-serve signup with Ross
fast-tracking OD verification.

## Locked decisions

1. **Money model = FEE-ONLY (matchmaker).** NotifEyes charges only its **$10
   match fee**; the practice pays the OD's **wage directly** (check / direct
   deposit / Venmo / Zelle). Platform never holds wages. Stripe Connect
   "guaranteed pay" is the **V2/production** upgrade.
2. **Fee timing:** authorize the $10 hold at booking; **capture only when the
   practice confirms the OD showed up**; no-show ⇒ no fee (release hold).
3. **Attendance:** dropped OD check-in/out; practice **"Did Dr. ___ show up?"**
   prompt captures the fee on "Yes"; silence/"No" → no-show path.
4. **Cancellation = reputation-only, NO platform charge.** Notify the other side,
   reopen the shift, record it on the canceller's reliability record.
5. **Card capture = just-in-time at first booking** (saved for reuse). *(A3 —
   BUILT. SetupIntent saves the card once; bookings authorize off_session against
   it. Card UI on `/p/billing` + a just-in-time booking gate. Test-mode; flag held
   at `stub`.)*
6. **Email alerts ON by default** at signup (OD + practice).
7. **First OD watch zone = one-tap "Watch the Bay Area"**; map/ZIP optional refine.
8. **Proactive comms = key moments on by default (email)** + a profile
   "concierge" toggle for extras. *(Phase D — not yet built.)*
9. **Money clarity = role-aware:** OD sees "You earn $X"; practice sees "wage
   (paid direct) + $10 match fee."

## Verified facts (from the review)
- The OD keeps 100% of rate × hours; the fee is the practice's, charged on top
  (`src/lib/pricing.ts`).
- **Geocoding works** on both signup and settings edit (`src/lib/geocode.ts`,
  Mapbox). The old Settings copy "geocoding requires admin action for V1" was
  stale — **fixed in B4**.

---

## Roadmap (each phase ≈ its own PR)

### Phase A — Fee-only money pivot  ✅ (A1/A2/A4 merged, PR #26) · 🔨 A3 built (test-mode; flag held)
SPINE / money files. The foundation everything else sits on.
- `src/lib/pricing.ts` — platform processes the **fee only**; wage recorded, not charged. ✅
- Booking creation (`…/book/[appId]/actions.ts`, `…/invite-response-actions.ts`):
  `payments.createIntent` authorizes the **$10 fee** (manual capture). ✅
- **A3 — card capture (just-in-time):** 🔨 **built.** `src/lib/payments/setup.ts`
  (Customer + SetupIntent + saved-card persistence), `/p/billing` `AddCardForm`
  (`<PaymentElement>`), just-in-time booking gate, off_session authorize in both
  booking actions, webhook `setup_intent.succeeded`, migration `0005`. Flip
  `PAYMENTS_PROVIDER=stripe` after the keys are set + the manual smoke passes.
- **Attendance → fee capture:** practice "Did the doctor show?" prompt; "Yes"
  captures via `payments.capture` + `src/app/api/payments/webhook/route.ts`. ✅
- **No-show:** release the $10 hold; record reliability hit. ✅
- **Cancellation = reputation-only:** stripped wage-% from `src/lib/cancellation.ts`
  + cancel actions; cancel = notify + reopen + reliability + release hold. ✅
- **Billing** (`…/p/billing/page.tsx`): show match fees + receipts. ✅
- **OD payouts** (`…/d/payouts/page.tsx`): "wage owed, paid directly" statement. ✅

### Phase B — Activation & first run  ✅ (PR #27)
- Email opt-in **default ON** at signup. ✅
- OD: setup home usable while pending (alerts ✓ / where you'll work / upload
  license); welcome guidance earlier; one-tap "Watch the Bay Area". ✅
- Practice: fixed the stale geocoding copy + geocode-miss feedback; softened the
  synthetic reach estimate; post-signup dashboard guidance. ✅

### Phase C — The match→book loop  ✅ (PR #28)
- Email alert = hero channel: rich HTML + one-tap "View & apply"
  (`fanout-shift-posted.ts`, `notifications/channels/email.ts`). ✅
- In-app toast/banner on a new match (`NotificationsLive`). ✅
- OD **Withdraw** button + apply receipt. ✅
- Invite-accept payment-failure limbo → calm booking-page messaging (display
  half; real charge waits on A3). ✅
- Practice: decline confirm; deduped the Book button; "Boost" → "Boost reach".
  (Scope-toggle label was already clear — skipped.) ✅

### Phase D — Proactive comms (key-moments default + concierge toggle)  ✅ merged (D1–D3 in #30 · D4 in #31)
- Notification-preference model: key moments on by default (email) + a
  **concierge toggle** in the OD/practice profile (`src/lib/notifications/**`,
  opt-in state). ✅ `conciergeOptedIn` flag (migration `0004`), `wantsConcierge`
  helper, toggle on both OD profile + practice settings.
- New key moments: shift-tomorrow reminder (OD), "did the doctor show?"
  (practice), payout/wage sent (OD). ✅ **already existed** (shift-reminders 24h/1h
  · booking-completed-followups `attendance_check` · admin `payout_sent`) — no
  new work needed.
- Concierge extras (gated on `conciergeOptedIn`):
  - morning-of reminder w/ address ✅ — new `src/workers/jobs/concierge-reminders.ts`
    (every 15 min; reuses `shift_reminder` kind, `window=morning_of`; OD-only).
  - `.ics` calendar invite ✅ — `src/lib/calendar.ts` + Resend attachment support;
    attached to booking-confirmed for both sides when opted in.
  - status pings ✅ (D4) — 4 opt-in pings: OD shortlisted / passed / filled-
    elsewhere (`application_update`) + practice no-applicants nudge
    (`shift_unfilled`, new `shift-unfilled-nudge` worker).
  - SPINE — worker boot verified: all 10 queues register incl. `concierge-reminders (cron)`
    and `shift-unfilled-nudge (cron)`.

### Phase E — Money clarity & trust polish  ⬜ not started
- Role-aware money panel on `src/app/bookings/[id]/page.tsx`: OD "You earn $X";
  practice "wage (direct) + $10 fee". *(C4 already added the calm fee-status note;
  E is the fuller role-aware breakdown.)*
- No-show card: "This looks wrong? message practice / contact support" + show each
  party their own reliability standing.
- Contract (`src/lib/contract.ts`): plain-language consequences + link to the
  planned `/legal/beta-agreement` + save/download a copy.
- Human payout/wage status everywhere ("Sent Jun 5").

## Out of scope for beta
- Stripe Connect / platform-held wages + guaranteed pay (production).
- In-app bank capture for ODs.
- Shift search / advanced filtering; applicant smart-ranking.
- Real-time applicant list; group messaging; message attachments UI.
- True direct-connection SSE (Supabase IPv4 add-on question).

## Verification (per phase)
- `npx tsc --noEmit`, then `next build` with CI env (catches server-only boundary
  breaks — likely when splitting money helpers for client money panels).
- SPINE phases (A, D): restart `npm run worker` to confirm queue registration boots.
- Watch CI to green (Typecheck+build **and** Playwright spine e2e) before merging.
- Manual: booking page shows "You earn" to the OD and "wage + $10 fee" to the
  practice on the same booking.
