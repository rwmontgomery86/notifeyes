import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  DollarIcon,
  ListIcon,
  PercentIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  ZapIcon,
} from "@/components/marketing/icons";

export const metadata: Metadata = {
  title: "For Optometrists — NotifEyes",
  description:
    "Set your watch zones. Get matched with paid shifts near you. Claim in seconds. Get paid directly — free for ODs, forever.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "What does it cost?",
    a: "Zero. Forever. Practices pay $10 per match. ODs are always free, with no subscription and no payout cut.",
  },
  {
    q: "How and when do I get paid?",
    a: "The practice pays you directly — check, direct deposit, Venmo, Zelle, whatever you two agree on. You get 100% of the agreed rate; NotifEyes never touches your money. Your dashboard tracks what each practice owes and when it was paid. Guaranteed in-app pay via Stripe Connect is on the V2 roadmap.",
  },
  {
    q: "Do I need malpractice insurance?",
    a: "Recommended. Some practices require it as a filter. Upload your cert once and we display it on your profile for the ones that ask.",
  },
  {
    q: "Can I block a practice?",
    a: "Yes. Both sides have a block list. They will never see your profile or appear in your feed once blocked.",
  },
  {
    q: "What about taxes / 1099?",
    a: "You're an independent contractor of the practice, and the practice pays you directly — so any 1099-NEC comes from the practice, not NotifEyes. Automated tax docs arrive with Stripe Connect in V2.",
  },
  {
    q: "How do cancellations work?",
    a: "There's no cancellation fee — NotifEyes never charges ODs anything. If you cancel, the practice is notified right away and the shift reopens to other ODs. Cancellations and no-shows do go on your reliability record, which practices can see — so cancel as early as you can when life happens.",
  },
];

export default function ForOptometristsPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="ods" />
      <Hero />
      <StatsBand />
      <HowItWorks />
      <AlertsSection />
      <TrustSection />
      <FaqSection />
      <FinalCta />
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
      <div className="max-w-wide mx-auto grid grid-cols-1 items-center gap-14 px-7 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div className="relative z-10">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Made for Optometrists
          </div>
          <h1 className="font-display mt-4 max-w-[12ch] text-[52px] font-bold leading-[1.02] tracking-[-0.02em] text-ink sm:text-[64px] xl:text-[72px]">
            Your phone buzzes.
            <br />
            <em className="italic text-sage">Tap to claim.</em>
          </h1>
          <p className="mt-5 max-w-[430px] text-[18px] leading-[1.55] text-ink-2">
            Set your watch zones. Get matched with paid shifts near you. Claim
            in seconds. Get paid directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <MarketingButton href="/signup?role=od" variant="primary" size="xl">
              Set up my watch zones →
            </MarketingButton>
            <MarketingButton
              href="/d/shifts"
              variant="ghost"
              size="xl"
              className="!bg-paper-card !text-ink"
            >
              See live shifts
            </MarketingButton>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              "Free for ODs",
              "100% of the agreed rate",
              "Paid directly by the practice",
            ].map((l) => (
              <span
                key={l}
                className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"
              >
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-rust" />
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-start lg:pl-10">
          <div className="relative">
            <HeroBackdrop />
            <PhoneFrame className="relative w-[290px]">
              <HeroPhoneScreen />
            </PhoneFrame>
          </div>
          <HeroAnnotation />
        </div>
      </div>
    </section>
  );
}

/* Dashed watch-zone rings + clinic-pin marks behind the hero phone. */
function HeroBackdrop() {
  return (
    <svg
      viewBox="0 0 700 700"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[165%] w-auto -translate-x-1/2 -translate-y-1/2"
    >
      <circle
        cx="350"
        cy="350"
        r="235"
        stroke="var(--rust)"
        strokeOpacity="0.4"
        strokeWidth="2"
        strokeDasharray="3 10"
      />
      <circle
        cx="350"
        cy="350"
        r="320"
        stroke="var(--rust)"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeDasharray="3 10"
      />
      <ClinicPin x={96} y={150} s={1} opacity={0.3} />
      <ClinicPin x={608} y={92} s={1.5} opacity={0.35} />
      <ClinicPin x={628} y={520} s={2.1} opacity={0.4} />
      <ClinicPin x={60} y={470} s={1.3} opacity={0.25} />
    </svg>
  );
}

/* Outlined map pin with a medical cross, drawn in a 24×33 local space. */
function ClinicPin({
  x,
  y,
  s,
  opacity,
}: {
  x: number;
  y: number;
  s: number;
  opacity: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${s})`}
      stroke="var(--rust)"
      strokeOpacity={opacity}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1C5.9 1 1 5.9 1 12c0 8.2 11 20 11 20s11-11.8 11-20C23 5.9 18.1 1 12 1z" />
      <path d="M12 8v8M8 12h8" />
    </g>
  );
}

function HeroAnnotation() {
  return (
    <div
      aria-hidden="true"
      className="absolute -right-3 top-14 hidden w-[170px] xl:block"
    >
      <div className="font-script -rotate-3 text-[27px] font-semibold leading-[1.1] text-ink">
        Shifts that
        <br />
        find you.
      </div>
      <svg
        viewBox="0 0 100 24"
        fill="none"
        className="-mt-1 ml-1 h-4 w-[92px]"
      >
        <path
          d="M3 14C24 8 62 6 97 12"
          stroke="var(--sage)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 80 80" fill="none" className="ml-2 mt-2 h-16 w-16">
        <path
          d="M66 6C58 34 42 52 16 62"
          stroke="var(--ink)"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M28 56l-13 7 3-15"
          stroke="var(--ink)"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

type MockShift = {
  clinic: string;
  when: string;
  rate: string;
  distance: string;
  match: boolean;
};

const MOCK_SHIFTS: MockShift[] = [
  { clinic: "Marina Eye", when: "Tue, Jun 2 · 9–5", rate: "$95/hr", distance: "2.1 mi", match: true },
  { clinic: "Glen Park Vision", when: "Fri, Jun 5 · 9–1", rate: "$100/hr", distance: "0.8 mi", match: false },
  { clinic: "Inner Sunset OD", when: "Wed, Jun 3 · 12–8", rate: "$110/hr", distance: "6.4 mi", match: false },
];

/* Product mock — spans only, nothing focusable. */
function HeroPhoneScreen() {
  return (
    <div className="flex h-[512px] flex-col">
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-[20px] font-bold text-ink">
            Open shifts
          </span>
          <Chip variant="sage" className="!text-[11px]">
            3 in zone
          </Chip>
        </div>
        <div className="mt-1 text-[11.5px] text-ink-3">
          Watch zone · SF Mission · 50 mi
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {MOCK_SHIFTS.map((s) => (
            <div
              key={s.clinic}
              className={`rounded-xl border p-3 ${
                s.match
                  ? "border-[#a8d5f0] bg-rust-soft"
                  : "border-rule bg-paper-card"
              }`}
            >
              {s.match && (
                <span className="mb-1.5 inline-flex rounded-full border border-[rgba(30,155,227,0.5)] px-2 py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.08em] text-rust-2">
                  Highest pay for early start
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <strong className="text-[13px] text-ink">{s.clinic}</strong>
                <span className="text-[11px] text-ink-3">{s.distance}</span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-ink-2">{s.when}</div>
              <div className="mt-2 flex items-center justify-between">
                <Chip variant="accent" className="!px-2 !text-[10.5px]">
                  {s.rate}
                </Chip>
                {s.match && (
                  <span className="rounded-full bg-rust px-3.5 py-1 text-[11px] font-semibold text-white">
                    Apply
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[12px] font-semibold text-rust">
          See all shifts
        </div>
      </div>

      {/* bottom tab bar */}
      <div className="mt-auto flex border-t border-rule px-2 pb-4 pt-2">
        {[
          { icon: <ListIcon className="h-4 w-4" />, l: "Shifts", active: true },
          { icon: <CalendarIcon className="h-4 w-4" />, l: "Schedule", active: false },
          { icon: <UserIcon className="h-4 w-4" />, l: "Profile", active: false },
        ].map((t) => (
          <span
            key={t.l}
            className={`flex flex-1 flex-col items-center gap-1 text-[9px] font-medium ${
              t.active ? "text-rust" : "text-ink-3"
            }`}
          >
            {t.icon}
            {t.l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- stats band */

const STATS: { icon: ReactNode; n: string; l: string; sub: string }[] = [
  {
    icon: <TagIcon className="h-7 w-7" />,
    n: "$0",
    l: "for ODs, forever",
    sub: "No fees. No catch.",
  },
  {
    icon: <PercentIcon className="h-7 w-7" />,
    n: "100%",
    l: "of the agreed rate",
    sub: "You keep what you earn.",
  },
  {
    icon: <ShieldIcon className="h-7 w-7" />,
    n: "Direct",
    l: "paid by the practice",
    sub: "No middleman. No delays.",
  },
  {
    icon: <ZapIcon className="h-7 w-7" />,
    n: "<10s",
    l: "to get notified",
    sub: "Real-time alerts for nearby shifts.",
  },
];

function StatsBand() {
  return (
    <section className="bg-paper px-7 py-12">
      <div className="max-w-wide mx-auto grid grid-cols-1 gap-y-9 rounded-[24px] bg-paper-deep px-9 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-[rgba(255,255,255,0.1)] lg:px-4">
        {STATS.map((s) => (
          <div key={s.n} className="flex items-start gap-4 lg:px-7">
            <span className="mt-1 shrink-0 text-rust">{s.icon}</span>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display text-[32px] font-bold leading-none tracking-[-0.02em] text-white">
                  {s.n}
                </span>
                <span className="text-[13.5px] font-medium text-[#c8d4e8]">
                  {s.l}
                </span>
              </div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-[#8b9ab8]">
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- how it works */

function HowItWorks() {
  return (
    <Section>
      <Container wide>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
          How it works
        </div>
        <h2 className="font-display mt-3 text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[48px]">
          We make it <span className="text-rust">simple.</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
          <StepCard
            n={1}
            title="Set your watch zones"
            desc="Draw the areas you want to work in. We'll watch them for you."
          >
            <ZoneMapIllustration />
          </StepCard>
          <StepArrow />
          <StepCard
            n={2}
            title="Get matched in real time"
            desc="Shifts pop up when a practice needs help in your zone."
          >
            <MatchIllustration />
          </StepCard>
          <StepArrow />
          <StepCard
            n={3}
            title="Tap to claim & go"
            desc="Claim in seconds, get confirmed, and head in."
          >
            <ConfirmIllustration />
          </StepCard>
        </div>
      </Container>
    </Section>
  );
}

function StepArrow() {
  return (
    <div className="hidden items-center md:flex">
      <ArrowRightIcon className="h-5 w-5 text-ink-3" />
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-rule bg-paper-card p-6 shadow-[0_1px_2px_rgba(27,42,78,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rust text-[14px] font-semibold text-white">
          {n}
        </span>
        <h3 className="font-display text-[19px] font-semibold text-ink">
          {title}
        </h3>
      </div>
      <p className="mt-2.5 text-sm leading-[1.55] text-ink-2">{desc}</p>
      <div className="mt-5 flex flex-1 items-end">{children}</div>
    </article>
  );
}

function ZoneMapIllustration() {
  return (
    <svg
      viewBox="0 0 280 150"
      aria-hidden="true"
      className="h-[150px] w-full rounded-xl border border-rule"
    >
      <rect width="280" height="150" fill="#eef5fb" />
      {/* street grid */}
      <g stroke="#ffffff" strokeWidth="3">
        <path d="M0 38h280M0 82h280M0 122h280" />
        <path d="M52 0v150M118 0v150M186 0v150M242 0v150" />
      </g>
      <g stroke="#d5e3f0" strokeWidth="1">
        <path d="M0 60h280M0 102h280M85 0v150M152 0v150M214 0v150" />
      </g>
      {/* watch zone polygon */}
      <path
        d="M74 34L196 24l52 52-34 56-118 6-42-58z"
        fill="rgba(30,155,227,0.14)"
        stroke="var(--rust)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {["74 34", "196 24", "248 76", "214 132", "96 138", "54 80"].map((p) => (
        <circle
          key={p}
          cx={Number(p.split(" ")[0])}
          cy={Number(p.split(" ")[1])}
          r="3.5"
          fill="#fff"
          stroke="var(--rust)"
          strokeWidth="2"
        />
      ))}
      {/* center eye mark */}
      <circle cx="146" cy="80" r="17" fill="#fff" stroke="var(--rust)" strokeWidth="2" />
      <ellipse cx="146" cy="80" rx="9.5" ry="6.5" fill="none" stroke="var(--rust)" strokeWidth="2" />
      <circle cx="146" cy="80" r="2.8" fill="var(--rust)" />
      {/* nearby practice dots */}
      <circle cx="108" cy="52" r="3" fill="var(--ink-3)" />
      <circle cx="196" cy="104" r="3" fill="var(--ink-3)" />
      <circle cx="172" cy="46" r="3" fill="var(--ink-3)" />
    </svg>
  );
}

function MatchIllustration() {
  return (
    <div className="w-full rounded-t-[20px] border border-b-0 border-rule bg-paper px-3.5 pb-1 pt-3.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-rust" />
        New shift near you
      </div>
      <div className="mt-2.5 rounded-xl border border-rule bg-paper-card p-3 shadow-[0_8px_20px_rgba(27,42,78,0.08)]">
        <div className="flex items-baseline justify-between">
          <strong className="text-[13px] text-ink">Sunset Vision</strong>
          <span className="text-[11px] text-ink-3">1.7 mi</span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-ink-2">Today · 1–5 PM</div>
        <div className="mt-2 inline-flex">
          <Chip variant="accent" className="!px-2 !text-[10.5px]">
            $105/hr
          </Chip>
        </div>
      </div>
    </div>
  );
}

function ConfirmIllustration() {
  return (
    <div className="w-full rounded-xl border border-rule bg-paper p-4 text-center">
      <CheckCircleIcon className="mx-auto h-9 w-9 text-sage" />
      <div className="mt-2 text-[12px] font-semibold text-sage">
        You&apos;re confirmed!
      </div>
      <div className="mt-1.5 font-display text-[15px] font-semibold text-ink">
        Sunset Vision
      </div>
      <div className="text-[11.5px] text-ink-2">Today · 1–5 PM</div>
      <span className="mt-3 inline-flex rounded-full bg-rust px-4 py-1.5 text-[11.5px] font-semibold text-white">
        View details
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- alerts */

const ALERT_FEATURES: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <BellIcon className="h-5 w-5" />,
    t: "Instant shift alerts",
    d: "Real-time notifications for shifts in your watch zones.",
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    t: "Flexible schedule",
    d: "Work when you want. A few hours or all day.",
  },
  {
    icon: <DollarIcon className="h-5 w-5" />,
    t: "Transparent pay",
    d: "See the rate up front. No surprises.",
  },
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    t: "You're protected",
    d: "Cancellations and no-shows go on the record — both sides.",
  },
];

function AlertsSection() {
  return (
    <section
      className="py-20"
      style={{
        background:
          "linear-gradient(180deg, rgba(220,238,250,0.35) 0%, rgba(220,238,250,0.75) 50%, rgba(220,238,250,0.25) 100%)",
      }}
    >
      <Container wide>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1">
            <PhoneFrame
              dark
              className="w-[280px]"
              screenClassName="bg-[linear-gradient(180deg,#1b2a4e_0%,#2b4478_100%)]"
            >
              <LockScreenMock />
            </PhoneFrame>
          </div>

          <div className="order-1 lg:order-2">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Built around your week
            </div>
            <h2 className="font-display mt-3 text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-ink md:text-[44px]">
              Alerts that fit <em className="italic text-rust">your life.</em>
            </h2>
            <div className="mt-9 flex flex-col gap-7">
              {ALERT_FEATURES.map((f) => (
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
        </div>
      </Container>
    </section>
  );
}

const LOCK_NOTIFICATIONS: {
  icon: ReactNode;
  iconBg: string;
  t: string;
  d: string;
  time: string;
}[] = [
  {
    icon: <BellIcon className="h-4 w-4 text-white" />,
    iconBg: "bg-rust",
    t: "New shift near you",
    d: "Sunset Vision · Today 1–5 PM",
    time: "1m ago",
  },
  {
    icon: <CheckIcon className="h-4 w-4 text-white" />,
    iconBg: "bg-sage",
    t: "Shift claimed",
    d: "You're confirmed for today, 1–5 PM",
    time: "3m ago",
  },
  {
    icon: <ClockIcon className="h-4 w-4 text-white" />,
    iconBg: "bg-[rgba(255,255,255,0.22)]",
    t: "Reminder",
    d: "Your shift starts in 1 hour",
    time: "12:00 PM",
  },
];

function LockScreenMock() {
  return (
    <div className="flex h-[440px] flex-col px-3.5">
      <div className="mt-7 text-center font-display text-[22px] font-semibold text-white">
        Tuesday, June 3
      </div>
      <div className="mt-7 flex flex-col gap-2.5">
        {LOCK_NOTIFICATIONS.map((n) => (
          <div
            key={n.t}
            className="flex items-center gap-3 rounded-2xl bg-[rgba(255,255,255,0.14)] px-3.5 py-3"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${n.iconBg}`}
            >
              {n.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] font-semibold text-white">
                  {n.t}
                </span>
                <span className="shrink-0 text-[10px] text-[rgba(255,255,255,0.6)]">
                  {n.time}
                </span>
              </div>
              <div className="truncate text-[11.5px] text-[rgba(255,255,255,0.75)]">
                {n.d}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- trust */

const TRUST_FACTS: { icon: ReactNode; n: string; l: string }[] = [
  {
    icon: <CircleCheckIcon className="h-5 w-5" />,
    n: "100%",
    l: "of ODs license-verified",
  },
  {
    icon: <ZapIcon className="h-5 w-5" />,
    n: "< 10s",
    l: "from shift post to alert",
  },
  {
    icon: <TagIcon className="h-5 w-5" />,
    n: "$0",
    l: "OD fees — forever",
  },
];

function TrustSection() {
  return (
    <Section>
      <Container wide>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
          From optometrists
        </div>
        <div className="mt-7 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="font-display text-[26px] font-medium italic leading-[1.35] text-ink md:text-[30px]">
              <span className="text-rust">&ldquo;</span>I was on the bus. My
              phone buzzed. Tuesday morning at a clinic 4 miles away. I tapped
              apply. Booked by the time I got off at my stop. Rent for the
              month.<span className="text-rust">&rdquo;</span>
            </p>
            {/* placeholder until a real beta testimonial exists */}
            <div className="mt-7 flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#a8d5f0] bg-rust-soft text-base text-rust-2">
                [ph]
              </div>
              <div>
                <div className="text-[15px] font-semibold text-ink">
                  [Dr. Lorem Lin, OD]
                </div>
                <div className="text-sm text-ink-2">[7 years · Oakland, CA]</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-rule bg-paper-card p-7 shadow-[0_2px_12px_rgba(27,42,78,0.07)]">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-sage" />
              <span className="font-display text-[17px] font-semibold text-ink">
                What every OD gets on day one
              </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-rule pt-6">
              {TRUST_FACTS.map((f) => (
                <div key={f.n} className="text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-rust-soft text-rust">
                    {f.icon}
                  </span>
                  <div className="font-display mt-2.5 text-[22px] font-bold leading-none tracking-[-0.01em] text-ink">
                    {f.n}
                  </div>
                  <div className="mt-1 text-[12px] leading-snug text-ink-2">
                    {f.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ faq */

function FaqSection() {
  return (
    <Section variant="alt">
      <Container wide>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Common questions
            </div>
            <h2 className="font-display mt-3 text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[44px]">
              Things ODs ask first.
            </h2>
          </div>
          <Link
            href="/help"
            className="text-sm font-semibold text-rust no-underline hover:text-rust-2"
          >
            View all FAQs →
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-1 items-start gap-3.5 md:grid-cols-2">
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              className="group rounded-xl border border-rule bg-paper-card px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-[17px] font-semibold text-ink">
                <span>{f.q}</span>
                <PlusIcon className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-[1.6] text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------- final cta */

function FinalCta() {
  return (
    <section className="bg-rust px-7 py-20 text-center">
      <h2 className="font-display mx-auto max-w-[720px] text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white md:text-[56px]">
        Shifts that <em className="italic">find you.</em>
      </h2>
      <p className="mx-auto mt-4 max-w-[460px] text-[17px] leading-[1.55] text-[rgba(255,255,255,0.85)]">
        Set your zones once, then claim the shifts you want.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        <MarketingButton
          href="/signup?role=od"
          size="lg"
          className="!border-white !bg-white !text-rust-2 hover:!bg-[#eaf4fc]"
        >
          Set up my watch zones →
        </MarketingButton>
        <MarketingButton
          href="/for-practices"
          size="lg"
          className="!border-[rgba(255,255,255,0.7)] !text-white hover:!bg-[rgba(255,255,255,0.14)] hover:!text-white"
        >
          I run a practice →
        </MarketingButton>
      </div>
    </section>
  );
}
