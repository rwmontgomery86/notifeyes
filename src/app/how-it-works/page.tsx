import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Chip } from "@/components/marketing/Chip";
import { LaptopFrame } from "@/components/marketing/LaptopFrame";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { MARKETING_MATCH_FEE_DISPLAY } from "@/lib/format";
import {
  ArrowRightIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarIcon,
  ListIcon,
  MapPinIcon,
  MessageIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SmartphoneIcon,
  TagIcon,
  TargetIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/marketing/icons";

export const metadata: Metadata = {
  title: "How it works — NotifEyes",
  description:
    "Post once. NotifEyes alerts the right ODs in seconds, you pick your match, and pay a flat $10 only when the shift is filled.",
};

export default function HowItWorksPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="how" />
      <Hero />
      <TrustStrip />
      <WorkflowSection />
      <MatchingSection />
      <SafetySection />
      <FinalCTA
        decorated
        subhead="Two-minute sign up. ODs always free. Practices pay only when they book."
      />
      <SiteFooter />
    </div>
  );
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  return (
    <section
      className="relative overflow-x-clip border-b border-rule"
      style={{
        background:
          "linear-gradient(135deg, var(--paper-card) 0%, var(--paper-card) 40%, var(--rust-soft) 130%)",
      }}
    >
      <div className="max-w-wide mx-auto grid grid-cols-1 items-center gap-14 px-7 py-14 lg:grid-cols-[1fr_1.15fr] lg:py-16">
        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            How it works
          </div>
          <h1 className="font-display mt-4 text-[48px] font-bold leading-[1.02] tracking-[-0.02em] text-ink sm:text-[60px] xl:text-[72px]">
            From shift
            <br />
            to <em className="italic text-rust">filled.</em>
          </h1>
          <p className="mt-5 max-w-[440px] text-[18px] leading-[1.55] text-ink-2">
            Post once. NotifEyes watches your zones, alerts the right ODs, and
            helps you book — so you can focus on patients.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <MarketingButton
              href="/signup?role=practice"
              variant="primary"
              size="xl"
            >
              I&apos;m a practice →
            </MarketingButton>
            <MarketingButton
              href="/signup?role=od"
              size="xl"
              className="!bg-paper-card"
            >
              I&apos;m an optometrist →
            </MarketingButton>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] pb-8 pr-3 pt-10 sm:pr-10 lg:mx-0">
      <HeroRings />
      <LaptopFrame className="relative">
        <PracticeDashboardScreen />
      </LaptopFrame>
      <MiniPhone className="absolute bottom-0 right-0 z-10 w-[148px] sm:w-[168px]" />
      <FloatingMatchCard className="absolute -top-2 right-2 z-20 hidden sm:block" />
      <Sparkle className="absolute right-8 top-2 hidden h-4 w-4 text-rust sm:block" />
      <Sparkle className="absolute -left-4 bottom-16 h-3 w-3 text-rust opacity-60" />
    </div>
  );
}

/* Dashed watch-zone ring arcs behind the laptop. */
function HeroRings() {
  return (
    <svg
      viewBox="0 0 700 700"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-auto -translate-x-1/2 -translate-y-1/2"
    >
      <circle
        cx="350"
        cy="350"
        r="260"
        stroke="var(--rust)"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="3 10"
      />
      <circle
        cx="350"
        cy="350"
        r="340"
        stroke="var(--rust)"
        strokeOpacity="0.22"
        strokeWidth="2"
        strokeDasharray="3 10"
      />
    </svg>
  );
}

/* Four-point sparkle accent. */
function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0c.9 5.6 2.6 8.4 3.4 9.2.8.8 3.6 2.4 8.6 2.8-5 .4-7.8 2-8.6 2.8-.8.8-2.5 3.6-3.4 9.2-.9-5.6-2.6-8.4-3.4-9.2C7.8 14 5 12.4 0 12c5-.4 7.8-2 8.6-2.8C9.4 8.4 11.1 5.6 12 0z" />
    </svg>
  );
}

/* Practice dashboard product mock — spans only, nothing focusable. */

const GLANCE_TILES: { n: string; l: string; sage?: boolean }[] = [
  { n: "3", l: "Active shifts" },
  { n: "7", l: "New alerts" },
  { n: "2", l: "Matches" },
  { n: "1", l: "Filled", sage: true },
];

const LIVE_ALERTS: { clinic: string; when: string; where: string; rate: string }[] = [
  {
    clinic: "Bayview Eye Care",
    when: "Today · 9:00 AM – 5:00 PM",
    where: "Geary Blvd · San Francisco",
    rate: "$95/hr",
  },
  {
    clinic: "Sunset Optometry",
    when: "Tomorrow · 9:00 AM – 1:00 PM",
    where: "Sunset Blvd · San Francisco",
    rate: "$105/hr",
  },
  {
    clinic: "Oceanview Optometry",
    when: "Wed · 12:00 – 8:00 PM",
    where: "Ocean Ave · Daly City",
    rate: "$100/hr",
  },
];

const SIDEBAR_NAV = [
  "Dashboard",
  "Shifts",
  "Applicants",
  "Calendar",
  "Messages",
  "Billing",
];

function PracticeDashboardScreen() {
  return (
    <div className="grid grid-cols-[104px_1fr] sm:grid-cols-[122px_1fr]">
      {/* sidebar */}
      <div className="flex flex-col gap-1 bg-paper-deep px-2.5 py-3">
        <span className="mb-2 flex items-center gap-1 px-1.5 text-[10px] font-bold text-white">
          <span className="inline-block h-2 w-2 rounded-full bg-rust" />
          Notif<span className="-ml-1 text-rust">Eyes</span>
        </span>
        {SIDEBAR_NAV.map((l, i) => (
          <span
            key={l}
            className={`rounded-md px-1.5 py-1 text-[9px] font-medium ${
              i === 0 ? "bg-white/10 text-white" : "text-white/55"
            }`}
          >
            {l}
          </span>
        ))}
      </div>

      {/* main pane */}
      <div className="flex flex-col gap-2 px-3 py-3">
        <span className="text-[11px] font-semibold text-ink">
          Today at a glance
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {GLANCE_TILES.map((t) => (
            <span
              key={t.l}
              className={`flex flex-col rounded-lg border p-1.5 ${
                t.sage
                  ? "border-[rgba(63,175,79,0.35)] bg-sage-soft"
                  : "border-rule bg-paper"
              }`}
            >
              <span className="font-display text-[15px] font-bold leading-none text-ink">
                {t.n}
              </span>
              <span className="mt-1 text-[7.5px] font-medium text-ink-3">
                {t.l}
              </span>
            </span>
          ))}
        </div>

        <span className="mt-1 text-[10px] font-semibold text-ink">
          Live alerts
        </span>
        <div className="flex flex-col gap-1.5">
          {LIVE_ALERTS.map((a, i) => (
            <span
              key={a.clinic}
              className="flex items-center justify-between rounded-lg border border-rule bg-paper-card p-1.5 shadow-[0_1px_2px_rgba(27,42,78,0.04)]"
            >
              <span className="flex flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="text-[9.5px] font-semibold text-ink">
                    {a.clinic}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-rust-soft px-1.5 py-[1px] text-[6.5px] font-bold uppercase tracking-[0.06em] text-rust-2">
                      New
                    </span>
                  )}
                </span>
                <span className="text-[8px] text-ink-2">{a.when}</span>
                <span className="text-[8px] text-ink-3">{a.where}</span>
              </span>
              <span className="text-[9px] font-bold text-rust-2">{a.rate}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Lighter phone shell for the hero overlap — PhoneFrame's fixed-px status
   bar and side buttons don't scale down to this width. */
function MiniPhone({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[26px] bg-[#111a2e] p-[6px] shadow-[0_24px_48px_-16px_rgba(27,42,78,0.5)] ${className}`}
    >
      <div className="flex aspect-[9/18.5] flex-col overflow-hidden rounded-[20px] bg-paper">
        <span className="flex items-center justify-between px-3 pt-1.5 text-[8px] font-semibold text-ink">
          9:41
          <span className="h-[8px] w-[34px] rounded-full bg-[#111a2e]" />
          <span className="inline-block h-[5px] w-[10px] rounded-[2px] border border-ink/40" />
        </span>
        <div className="m-2 rounded-xl border border-rule bg-paper-card p-2 shadow-[0_2px_6px_rgba(27,42,78,0.08)]">
          <span className="flex items-center gap-1 text-[7.5px] font-bold uppercase tracking-[0.06em] text-rust">
            <BellIcon className="h-2.5 w-2.5" />
            New shift near you
          </span>
          <span className="mt-1 block text-[10px] font-semibold text-ink">
            Bayview Eye Care
          </span>
          <span className="block text-[8px] text-ink-2">
            Today · 9:00 AM – 5:00 PM
          </span>
          <span className="block text-[8px] text-ink-3">
            Geary Blvd · San Francisco
          </span>
          <span className="mt-0.5 block text-[9px] font-bold text-rust-2">
            $95/hr
          </span>
          <span className="mt-1.5 block rounded-full bg-rust py-1 text-center text-[8.5px] font-semibold text-white">
            View shift
          </span>
          <span className="mt-1 block rounded-full border border-rule py-1 text-center text-[8.5px] font-semibold text-ink-2">
            Pass
          </span>
        </div>
        <span className="mx-auto mb-1.5 mt-auto h-[3px] w-[38px] rounded-full bg-ink/20" />
      </div>
    </div>
  );
}

function FloatingMatchCard({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`w-[218px] rounded-2xl border border-rule bg-paper-card p-3.5 shadow-[0_18px_44px_-14px_rgba(27,42,78,0.35)] ${className}`}
    >
      <span className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust-soft text-rust">
          <BellIcon className="h-4 w-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-[12px] font-bold text-ink">New match</span>
          <span className="mt-0.5 text-[11px] font-medium text-ink-2">
            Bayview Eye Care
          </span>
          <span className="text-[10.5px] text-ink-3">9:00 AM – 5:00 PM</span>
          <Chip variant="accent" className="mt-1.5 self-start !px-2 !text-[10px]">
            $95/hr
          </Chip>
        </span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------- trust strip */

const TRUST_ITEMS: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <ZapIcon className="h-5 w-5" />,
    t: "Fast",
    d: "Post a shift in under a minute.",
  },
  {
    icon: <TargetIcon className="h-5 w-5" />,
    t: "Accurate",
    d: "Alerts go only to ODs watching your area.",
  },
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    t: "Reliable",
    d: "Every OD is license-verified before they can apply.",
  },
  {
    icon: <TagIcon className="h-5 w-5" />,
    t: "Affordable",
    d: `One flat ${MARKETING_MATCH_FEE_DISPLAY} fee — only when your shift is filled.`,
  },
];

function TrustStrip() {
  return (
    <section className="bg-paper px-7 py-12">
      <div className="max-w-wide mx-auto grid grid-cols-1 gap-y-6 rounded-2xl border border-rule bg-paper-card px-4 py-7 shadow-[0_2px_8px_rgba(27,42,78,0.06)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-rule">
        {TRUST_ITEMS.map((s) => (
          <div key={s.t} className="flex items-start gap-3.5 px-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust">
              {s.icon}
            </span>
            <span className="flex flex-col">
              <span className="font-display text-[15.5px] font-bold text-ink">
                {s.t}
              </span>
              <span className="mt-0.5 text-[12.5px] leading-[1.5] text-ink-2">
                {s.d}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- workflow */

const WORKFLOW_STEPS: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <PlusIcon className="h-5 w-5" />,
    t: "Post a shift",
    d: "Date, hours, rate, and notes. Live in under a minute.",
  },
  {
    icon: <BellIcon className="h-5 w-5" />,
    t: "Watch & alert",
    d: "We match it to OD watch zones. Email, SMS, and in-app — in seconds.",
  },
  {
    icon: <UsersIcon className="h-5 w-5" />,
    t: "ODs apply",
    d: "Interested ODs read the details and apply, with an optional note.",
  },
  {
    icon: <ListIcon className="h-5 w-5" />,
    t: "You review",
    d: "Compare applicants, check profiles, and pick your OD.",
  },
  {
    icon: <CheckCircleIcon className="h-5 w-5" />,
    t: "Shift confirmed",
    d: "One click books it. The engagement contract is signed automatically.",
  },
  {
    icon: <DollarIcon className="h-5 w-5" />,
    t: "Shift complete",
    d: `You pay the OD directly — full rate. Our flat ${MARKETING_MATCH_FEE_DISPLAY} fee applies only once they've shown up.`,
  },
];

function WorkflowSection() {
  return (
    <Section>
      <Container wide>
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            The workflow
          </div>
          <h2 className="font-display mt-3 text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-ink md:text-[44px]">
            How NotifEyes works
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {WORKFLOW_STEPS.map((s, i) => (
            <article
              key={s.t}
              className="relative rounded-2xl border border-rule bg-paper-card p-5 shadow-[0_1px_2px_rgba(27,42,78,0.05)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold tracking-[0.04em] text-rust">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust">
                {s.icon}
              </span>
              <h3 className="font-display mt-3.5 text-[17px] font-semibold leading-tight text-ink">
                {s.t}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">
                {s.d}
              </p>
              {i < WORKFLOW_STEPS.length - 1 && (
                <span className="absolute -right-[22px] top-[72px] z-10 hidden text-ink-3 xl:block">
                  <ArrowRightIcon className="h-5 w-5" />
                </span>
              )}
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ---------------------------------------------------- real-time matching */

const MATCHING_FEATURES: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <MapPinIcon className="h-5 w-5" />,
    t: "Zone aware",
    d: "ODs only see shifts in the areas they choose to watch.",
  },
  {
    icon: <TargetIcon className="h-5 w-5" />,
    t: "Smart filters",
    d: "Rate floors, shift types, and days of week — matched in real time.",
  },
  {
    icon: <SmartphoneIcon className="h-5 w-5" />,
    t: "Instant alerts",
    d: "Email, SMS, and in-app — seconds after a shift goes live.",
  },
];

function MatchingSection() {
  return (
    <Section variant="alt" className="overflow-x-clip">
      <Container wide>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Real-time matching
            </div>
            <h2 className="font-display mt-3 text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-ink md:text-[44px]">
              Right OD. Right place.{" "}
              <em className="italic text-rust">Right time.</em>
            </h2>
            <div className="mt-9 flex flex-col gap-7">
              {MATCHING_FEATURES.map((f) => (
                <div key={f.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgba(30,155,227,0.35)] bg-paper-card text-rust">
                    {f.icon}
                  </span>
                  <div>
                    <div className="text-[16px] font-semibold text-ink">
                      {f.t}
                    </div>
                    <p className="mt-0.5 text-sm leading-[1.55] text-ink-2">
                      {f.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MatchingVisualCluster />
        </div>
      </Container>
    </Section>
  );
}

function MatchingVisualCluster() {
  return (
    <div className="relative grid grid-cols-2 gap-4 lg:block lg:min-h-[520px]">
      {/* zone map card */}
      <div className="col-span-2 rounded-2xl border border-rule bg-paper-card p-3 shadow-[0_2px_10px_rgba(27,42,78,0.07)] lg:absolute lg:left-0 lg:top-6 lg:w-[420px]">
        <div className="relative">
          <ZoneMapIllustration />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-paper-card px-3 py-1.5 text-[11px] font-semibold text-ink shadow-[0_2px_8px_rgba(27,42,78,0.12)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
            </span>
            Watching your zones
          </span>
        </div>
      </div>

      {/* new alert card */}
      <div className="rounded-2xl border border-rule bg-paper-card p-3.5 shadow-[0_14px_36px_-12px_rgba(27,42,78,0.3)] lg:absolute lg:left-[240px] lg:top-[248px] lg:z-10 lg:w-[230px]">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-rust">
            New alert
          </span>
          <span className="text-[11px] text-ink-3">×</span>
        </div>
        <div className="mt-2.5">
          <strong className="text-[13px] text-ink">Bayview Eye Care</strong>
          <div className="mt-0.5 text-[11.5px] text-ink-2">
            Today · 9:00 AM – 5:00 PM
          </div>
          <div className="text-[11px] text-ink-3">
            Geary Blvd · San Francisco
          </div>
          <div className="mt-1 text-[12px] font-bold text-rust-2">$95/hr</div>
          <span className="mt-2.5 block rounded-full bg-rust py-1.5 text-center text-[11.5px] font-semibold text-white">
            View shift
          </span>
          <span className="mt-1.5 block rounded-full border border-rule py-1.5 text-center text-[11.5px] font-semibold text-ink-2">
            Pass
          </span>
        </div>
      </div>

      {/* OD profile card — verified facts only */}
      <div className="rounded-2xl border border-rule bg-paper-card p-3.5 shadow-[0_14px_36px_-12px_rgba(27,42,78,0.3)] lg:absolute lg:left-[300px] lg:top-[96px] lg:w-[212px]">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          OD near you
        </span>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rust-soft text-[12px] font-bold text-rust-2">
            AC
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink">
              Alex Chen, OD
            </div>
            <div className="text-[11px] text-ink-3">2.1 mi away</div>
          </div>
        </div>
        <Chip variant="sage" className="mt-2.5 !text-[10.5px]">
          License verified
        </Chip>
      </div>

      {/* lock-screen phone */}
      <div className="hidden lg:absolute lg:-right-2 lg:top-0 lg:block lg:rotate-[4deg]">
        <PhoneFrame
          dark
          className="w-[200px]"
          screenClassName="bg-[linear-gradient(180deg,#1b2a4e_0%,#2b4478_100%)]"
        >
          <MatchingLockScreen />
        </PhoneFrame>
      </div>
    </div>
  );
}

function MatchingLockScreen() {
  return (
    <div className="flex h-[330px] flex-col px-2.5">
      <div className="mt-5 text-center font-display text-[30px] font-semibold text-white">
        9:41
      </div>
      <div className="text-center text-[10px] text-[rgba(255,255,255,0.65)]">
        Monday, June 10
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[rgba(255,255,255,0.14)] px-2.5 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-rust">
          <BellIcon className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-1.5">
            <span className="truncate text-[10px] font-semibold text-white">
              NotifEyes
            </span>
            <span className="shrink-0 text-[8px] text-[rgba(255,255,255,0.6)]">
              now
            </span>
          </div>
          <div className="text-[9px] leading-snug text-[rgba(255,255,255,0.8)]">
            New shift match — Bayview Eye Care · Today 9:00 AM – 5:00 PM
          </div>
        </div>
      </div>
    </div>
  );
}

/* Street grid + watch-zone polygon, adapted from the For Optometrists kit. */
function ZoneMapIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      aria-hidden="true"
      className="h-auto w-full rounded-xl border border-rule"
    >
      <rect width="400" height="280" fill="#eef5fb" />
      {/* street grid */}
      <g stroke="#ffffff" strokeWidth="4">
        <path d="M0 66h400M0 148h400M0 224h400" />
        <path d="M74 0v280M168 0v280M266 0v280M346 0v280" />
      </g>
      <g stroke="#d5e3f0" strokeWidth="1.2">
        <path d="M0 108h400M0 188h400M120 0v280M218 0v280M306 0v280" />
      </g>
      {/* watch zone polygon */}
      <path
        d="M106 60L280 44l74 94-48 102-170 10-60-106z"
        fill="rgba(30,155,227,0.14)"
        stroke="var(--rust)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {["106 60", "280 44", "354 138", "306 240", "136 250", "76 144"].map(
        (p) => (
          <circle
            key={p}
            cx={Number(p.split(" ")[0])}
            cy={Number(p.split(" ")[1])}
            r="4.5"
            fill="#fff"
            stroke="var(--rust)"
            strokeWidth="2.5"
          />
        ),
      )}
      {/* center eye mark */}
      <circle cx="210" cy="146" r="22" fill="#fff" stroke="var(--rust)" strokeWidth="2.5" />
      <ellipse cx="210" cy="146" rx="12.5" ry="8.5" fill="none" stroke="var(--rust)" strokeWidth="2.5" />
      <circle cx="210" cy="146" r="3.6" fill="var(--rust)" />
      {/* nearby practice dots */}
      <circle cx="152" cy="96" r="4" fill="var(--ink-3)" />
      <circle cx="282" cy="196" r="4" fill="var(--ink-3)" />
      <circle cx="246" cy="86" r="4" fill="var(--ink-3)" />
    </svg>
  );
}

/* ------------------------------------------------------ when plans change */

const SAFETY_CARDS: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <ClockIcon className="h-5 w-5" />,
    t: "Cancellation",
    d: "If either side cancels, the shift reopens and nearby ODs are re-alerted instantly. No platform charge — and it goes on the canceller's reliability record.",
  },
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    t: "No-show",
    d: "If an OD doesn't show, you pay nothing — the match fee is only ever charged after the OD shows up. The no-show goes on their record.",
  },
  {
    icon: <MessageIcon className="h-5 w-5" />,
    t: "Stay in touch",
    d: "Message your OD directly in the app — confirm details, share parking info, or handle a late arrival without swapping phone numbers.",
  },
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    t: "Stay protected",
    d: "Every OD is license-verified by hand before they can apply, and blind reviews after each shift keep both sides honest.",
  },
];

function SafetySection() {
  return (
    <Section>
      <Container wide>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              When plans change
            </div>
            <h2 className="font-display mt-3 max-w-[480px] text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-ink md:text-[44px]">
              We&apos;ve got your back.{" "}
              <em className="italic text-rust">Every time.</em>
            </h2>
          </div>
          <p className="max-w-[380px] text-[15px] leading-[1.55] text-ink-2">
            Life happens. Here&apos;s how NotifEyes handles it so your schedule
            stays covered.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SAFETY_CARDS.map((c) => (
            <article
              key={c.t}
              className="rounded-2xl border border-rule bg-paper-card p-5 shadow-[0_1px_2px_rgba(27,42,78,0.05)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust">
                {c.icon}
              </span>
              <h3 className="font-display mt-3.5 text-[17px] font-semibold text-ink">
                {c.t}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-2">
                {c.d}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
