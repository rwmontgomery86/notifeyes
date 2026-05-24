import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import {
  MARKETING_MATCH_FEE_DISPLAY,
  MARKETING_SAMEDAY_DISPLAY,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "For Practices — NotifEyes",
  description:
    "Post a fill-in shift in 90 seconds. License-verified ODs in your zip get pinged. You pick. We handle the contract and the payout. Flat $9.99 per booked match.",
};

const STEPS: { t: string; d: string; note?: string }[] = [
  { t: "Post", d: "Date, hours, rate, services. Pulls from your scheduler if you connect it." },
  { t: "Sit back", d: "Matching ODs get pinged. Apps roll in.", note: "avg first app · 8 min" },
  { t: "Pick + book", d: "Compare applicants. One-tap to book. Contract auto-signed." },
  { t: "Day-of", d: "OD checks in. You confirm hours. We pay them." },
];

const FEATURES: { t: string; d: string }[] = [
  { t: "Calendar-first view", d: "Open · booked · no-shows in one month grid. Click any day to invite favorites." },
  { t: "Favorites + invites", d: "Tag ODs you would hire again. Invite them direct — they skip the queue." },
  { t: "Team seats", d: "Owner + schedulers. Roles for who can post and who can pay." },
  { t: "Built-in messaging", d: "Talk to your OD before they show up. Files, photos, EHR notes." },
  { t: "Cancel policy, written", d: "7-day, 48-hr, 4-hr tiers. We charge. You don't chase." },
  { t: "Invoices + receipts", d: "Monthly statement, per-shift breakout, downloadable PDFs." },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "How much do you take?",
    a: `Flat ${MARKETING_MATCH_FEE_DISPLAY} per booked shift. ${MARKETING_SAMEDAY_DISPLAY} for same-day or urgent. No percentage of the shift total. ODs get 100% of the agreed rate.`,
  },
  {
    q: "Are the ODs really vetted?",
    a: "License, DEA, ID, malpractice cert — all verified before an OD can apply to your shift. We use state board APIs where available and a manual queue (24-hr SLA) for the rest.",
  },
  {
    q: "What if the OD no-shows?",
    a: "15-min grace period, then full refund + we surface nearby watching ODs as emergency backups. The OD gets a flag. Three flags = suspension review.",
  },
  {
    q: "Can my scheduler post without my login?",
    a: "Yes. Add a Scheduler seat in Settings → Team. They can post shifts and book ODs but cannot see or change payment / billing.",
  },
  {
    q: "Do you integrate with my EHR?",
    a: "Read-only calendar pull on Crystal PM, RevolutionEHR, and OfficeMate at launch. Writes are V2.",
  },
];

export default function ForPracticesPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="practices" />

      {/* Hero */}
      <section className="border-b border-rule py-16">
        <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center px-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              For Practices
            </div>
            <h1
              className="font-display mt-4 text-[56px] md:text-[84px] font-medium leading-[0.97] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              We know the{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                Tuesday-morning
              </em>{" "}
              panic.
            </h1>
            <p className="mt-5 max-w-[500px] text-[19px] leading-[1.5] text-ink-2">
              Post the shift in 90 seconds. License-verified ODs in your zip get
              pinged. You pick someone you would hire twice. The whole thing costs{" "}
              {MARKETING_MATCH_FEE_DISPLAY}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
                Post your first shift →
              </MarketingButton>
              <MarketingButton href="/how-it-works" size="lg">
                Tour the dashboard
              </MarketingButton>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-ink-3">
              <span>✓ Free to post</span>
              <span>✓ {MARKETING_MATCH_FEE_DISPLAY} only when you book</span>
              <span>✓ No subscription</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Proof bar */}
      <section className="border-b border-rule bg-paper-2">
        <div className="max-w-wide mx-auto grid grid-cols-2 md:grid-cols-4 gap-7 px-7 py-8">
          {[
            { n: "8 min", l: "median first application" },
            { n: "94%", l: "shifts filled in V1 beta" },
            { n: "< 24 hr", l: "OD license verification" },
            { n: MARKETING_MATCH_FEE_DISPLAY, l: "per booked shift · flat" },
          ].map((s) => (
            <div key={s.l}>
              <div
                className="font-display text-5xl font-medium leading-[0.96] text-ink tracking-[-0.02em]"
                style={{ fontVariationSettings: '"SOFT" 30' }}
              >
                {s.n}
              </div>
              <div className="mt-1 text-[13px] text-ink-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Before / after */}
      <Section>
        <Container>
          <div className="mb-10 max-w-[720px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              What changes
            </div>
            <h2
              className="font-display mt-3.5 text-[56px] md:text-[64px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Same panic.{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                Different ending.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="rounded-card border border-rule bg-paper-card p-6">
              <div className="font-mono text-xs text-ink-3">BEFORE NOTIFEYES</div>
              <h3 className="font-display mt-2 text-2xl text-ink">The group text scramble.</h3>
              <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
                {[
                  "Text three OD friends. Hope one says yes.",
                  "Call the agency. 18% markup. Random person.",
                  "Reschedule 11 patients. Wave goodbye to revenue.",
                  "Spend the afternoon on credentialing paperwork.",
                ].map((l) => (
                  <li key={l} className="grid grid-cols-[14px_1fr] gap-3 text-sm text-ink-2">
                    <span className="mt-2 h-[1.5px] w-[6px] bg-ink-3" />
                    {l}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-card border border-[#a8d5f0] bg-rust-soft p-6">
              <div className="font-mono text-xs text-rust-2">WITH NOTIFEYES</div>
              <h3 className="font-display mt-2 text-2xl text-ink">The 90-second post.</h3>
              <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
                {[
                  "Post the shift in 90 seconds.",
                  "ODs in your zip with matching zones get pinged instantly.",
                  "Pick from real applicants with real ratings.",
                  `One-tap book. Contract auto-signed. ${MARKETING_MATCH_FEE_DISPLAY} flat.`,
                ].map((l) => (
                  <li key={l} className="grid grid-cols-[14px_1fr] gap-3 text-sm text-ink">
                    <span className="mt-2 h-2 w-2 rounded-full bg-rust" />
                    {l}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section variant="alt">
        <Container>
          <div className="mb-10 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              How it works · practices
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Four steps. The last three{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                are automatic.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <article
                key={s.t}
                className="rounded-card border border-rule bg-paper-card p-6"
              >
                <div className="font-mono text-xs text-rust tracking-[0.04em]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display mt-2 text-[22px] text-ink">{s.t}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{s.d}</p>
                {s.note && (
                  <div className="mt-3 inline-flex">
                    <Chip variant="accent">{s.note}</Chip>
                  </div>
                )}
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* In your dashboard */}
      <Section>
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              In your dashboard
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Built for the person{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                who actually books.
              </em>
            </h2>
            <p className="mt-3.5 max-w-[540px] text-[19px] leading-[1.5] text-ink-2">
              Whether that&apos;s you, your scheduler, or your office manager —
              separate seats, the right permissions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <article
                key={f.t}
                className="rounded-card border border-rule bg-paper-card p-6"
              >
                <h3 className="font-display text-[19px] text-ink">{f.t}</h3>
                <p className="mt-1.5 text-sm text-ink-2 leading-[1.6]">{f.d}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Quote */}
      <Section variant="alt">
        <Container className="max-w-[820px]">
          <p
            className="font-display text-[36px] italic leading-[1.3] text-ink"
            style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1' }}
          >
            <span className="text-rust">&ldquo;</span>I covered a same-day no-show
            in 40 minutes. The OD was license-verified before she even messaged me.
            I would have lost a full day of patients otherwise.
            <span className="text-rust">&rdquo;</span>
          </p>
          <div className="mt-8 flex items-center gap-3.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rule bg-paper-card text-lg text-ink-3">
              [ph]
            </div>
            <div>
              <div className="font-semibold text-base text-ink">[Dr. Lorem Park]</div>
              <div className="text-sm text-ink-2">[Owner · Marina Eye Group · SF]</div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pricing teaser */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
                Pricing
              </div>
              <h2
                className="font-display mt-3.5 text-5xl md:text-[64px] font-medium leading-[1.05] text-ink"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
              >
                {MARKETING_MATCH_FEE_DISPLAY} per booked shift.{" "}
                <em
                  className="not-italic"
                  style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
                >
                  No subscription.
                </em>
              </h2>
              <p className="mt-3.5 text-[19px] leading-[1.5] text-ink-2">
                Free to post. Free to browse. We charge you when, and only when,
                the chair is covered.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
                  Post your first shift →
                </MarketingButton>
                <MarketingButton href="/pricing" size="lg">
                  See full pricing
                </MarketingButton>
              </div>
            </div>
            <div className="relative rounded-card border border-[#a8d5f0] bg-rust-soft p-10">
              <div className="absolute -top-3 right-5">
                <Chip variant="solid">Day-one price · locked</Chip>
              </div>
              <div className="font-mono text-xs text-rust-2">PER BOOKED SHIFT</div>
              <div
                className="font-display mt-2 text-[96px] font-medium leading-[1] text-ink"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
              >
                $9.<span className="text-[56px]">99</span>
              </div>
              <p className="mt-2.5 text-sm text-ink leading-[1.6]">
                Flat. No %. No subscription. {MARKETING_SAMEDAY_DISPLAY} for
                same-day / urgent. OD gets 100% of the agreed rate.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="alt">
        <Container className="max-w-[820px]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Common questions
          </div>
          <h2
            className="font-display mt-3.5 mb-6 text-[56px] font-medium leading-[1.05] text-ink"
            style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
          >
            What practices ask first.
          </h2>
          <div className="flex flex-col">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                className="border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
                open={i === 0}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between font-display text-[22px] font-medium text-ink"
                  style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
                >
                  <span>{f.q}</span>
                  <span className="font-mono text-sm text-ink-3">—</span>
                </summary>
                <p className="mt-3 text-base leading-[1.6] text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section variant="dark">
        <Container className="text-center">
          <h2
            className="font-display mx-auto max-w-[900px] text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
            style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
          >
            Cover your next chair{" "}
            <em
              className="not-italic"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
            >
              before lunch.
            </em>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
              Post your first shift →
            </MarketingButton>
            <MarketingButton
              href="/for-optometrists"
              size="lg"
              className="!border-[#efe6d2] !text-[#efe6d2] hover:!bg-[#efe6d2] hover:!text-ink"
            >
              I&apos;m an optometrist →
            </MarketingButton>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </div>
  );
}
