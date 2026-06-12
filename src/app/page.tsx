import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { RoleBadge } from "@/components/marketing/RoleBadge";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  CircleCheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TargetIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/marketing/icons";
import { CompareTable } from "@/components/marketing/CompareTable";
import { HomeHero } from "@/components/marketing/HomeHero";
import {
  MARKETING_MATCH_FEE_DISPLAY,
} from "@/lib/format";
import {
  detectStateFromRequest,
  resolveStateOverride,
  type DetectedState,
} from "@/lib/geo/detectStateFromRequest";
import { getOpenShiftsForState } from "@/lib/marketing/getOpenShiftsForState";

function dashboardForRole(
  role?: "practice_owner" | "practice_scheduler" | "od" | "admin",
): string {
  if (role === "od") return "/d/shifts";
  if (role === "admin") return "/admin/verifications";
  return "/p/dashboard";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(dashboardForRole(session.user.role));

  const sp = await searchParams;
  const detected =
    resolveStateOverride(sp.state) ?? (await detectStateFromRequest());

  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="home" />
      <HomeHero />
      <WhyBoth />
      <ShiftTicker state={detected} />
      <WatchZoneSection />
      <Compare />
      <PricingTeaser />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

export const dynamic = "force-dynamic";

const SHIFT_TYPE_LABEL: Record<
  "fill_in" | "half_day" | "weekend" | "recurring" | "permanent",
  string
> = {
  fill_in: "Fill-in",
  half_day: "Half-day",
  weekend: "Weekend",
  recurring: "Recurring",
  permanent: "Permanent",
};

function formatShiftWhen(starts: Date, ends: Date): string {
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  });
  const hourFmt = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? "p" : "a";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
  };
  return `${dayFmt.format(starts)} · ${hourFmt(starts)}–${hourFmt(ends)}`;
}

async function ShiftTicker({ state }: { state: DetectedState | null }) {
  if (!state) return null;
  const rows = await getOpenShiftsForState(state.code);
  if (rows.length === 0) return null;

  return (
    <Section tight>
      <div className="max-w-wide mx-auto px-7">
        <div className="mb-3.5 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Open right now · {state.name}
            </div>
            <h3 className="font-display mt-1.5 text-[22px] font-semibold text-ink">
              {rows.length === 1
                ? "One shift is live."
                : `${rows.length} shifts are live.`}
            </h3>
          </div>
        </div>
        <div
          className="flex gap-4 overflow-hidden py-3.5"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
          }}
        >
          {rows.map((s) => {
            const tag = s.urgent ? "Urgent" : SHIFT_TYPE_LABEL[s.type];
            const rate = `$${Math.round(s.rateCentsPerHour / 100)}/hr`;
            return (
              <div
                key={s.id}
                className="flex min-w-[280px] flex-col gap-1.5 rounded-card border border-rule bg-paper-card p-3.5"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-ink">{s.practiceName}</strong>
                  <Chip>{tag}</Chip>
                </div>
                <div className="text-sm text-ink-2">
                  {formatShiftWhen(s.startsAt, s.endsAt)}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <Chip variant="accent">{rate}</Chip>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function WhyBoth() {
  return (
    <Section>
      <Container>
        <div className="relative grid gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
          <AudienceFeatureCard side="practice" />
          <CenterEmblem variant="inline" />
          <AudienceFeatureCard side="od" />
          <CenterEmblem variant="overlay" />
        </div>
      </Container>
    </Section>
  );
}

function AudienceFeatureCard({ side }: { side: "practice" | "od" }) {
  const isPractice = side === "practice";
  const bullets: [string, string][] = isPractice
    ? [
        ["Post in 90 seconds", "Pulls from your existing scheduler. Five fields, then publish."],
        ["Vetted ODs only", "License + DEA + ID, all verified before they can apply."],
        [`${MARKETING_MATCH_FEE_DISPLAY} per booked shift`, "Flat. No %, no markup, no agency middle-cut."],
        ["Cancel policy, written down", "7-day, 48-hr, 4-hr tiers. We enforce them so you're not chasing anyone."],
      ]
    : [
        ["Watch zones", "Draw where you would actually drive. Filter by day, rate, EHR."],
        ["One-tap apply", "Read the contract in the app. Apply with a single tap."],
        ["Free, always", "Zero fees on the OD side. Forever. You get 100% of the agreed rate."],
        ["Paid directly, in full", "The practice pays your full rate straight to you — no platform cut, tracked on your dashboard."],
      ];
  return (
    <article
      className={`flex flex-col rounded-2xl border p-6 lg:p-8 ${
        isPractice
          ? "border-rule bg-paper-card"
          : "border-[#a8d5f0] bg-rust-soft md:pl-16 lg:pl-16"
      }`}
    >
      <div className="flex items-center gap-2.5 text-rust">
        {isPractice ? (
          <UsersIcon className="h-5 w-5" />
        ) : (
          <UserIcon className="h-5 w-5" />
        )}
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">
          {isPractice ? "For practices" : "For optometrists"}
        </span>
      </div>
      <h3 className="font-display mt-3.5 text-[26px] font-medium leading-[1.15] text-ink lg:text-[30px]">
        {isPractice ? (
          <>
            Post once.
            <br />
            The right ODs apply.
          </>
        ) : (
          <>
            Set zones once.
            <br />
            The right shifts find you.
          </>
        )}
      </h3>
      <ul
        className={`m-0 mt-5 flex list-none flex-col gap-3 p-0 ${
          isPractice ? "md:pr-12" : ""
        }`}
      >
        {bullets.map(([h, d]) => (
          <li key={h} className="grid grid-cols-[20px_1fr] gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 text-sage" />
            <span className="text-ink">
              <strong>{h}.</strong>{" "}
              <span className="text-sm text-ink-2">{d}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <MarketingButton
          href={isPractice ? "/signup?role=practice" : "/signup?role=od"}
          variant="primary"
          size="md"
        >
          {isPractice ? "I'm a practice" : "I'm an optometrist"} →
        </MarketingButton>
      </div>
    </article>
  );
}

function CenterEmblem({ variant }: { variant: "overlay" | "inline" }) {
  const badge = (
    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(30,155,227,0.6)] bg-white shadow-[0_8px_24px_rgba(27,42,78,0.14)]">
      <Image
        src="/notifeyes-mark.png"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 object-contain"
      />
      <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-sage" />
    </div>
  );
  if (variant === "inline") {
    return (
      <div aria-hidden="true" className="mx-auto -my-1 md:hidden">
        {badge}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
    >
      <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full bg-paper">
        <span className="absolute inset-3 rounded-full border border-[rgba(30,155,227,0.45)]" />
        <span className="absolute left-1/2 top-[7px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-rust" />
        <span className="absolute bottom-[7px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-rust" />
        {badge}
      </div>
    </div>
  );
}

function WatchZoneSection() {
  return (
    <Section>
      <Container>
        <HowItWorksStrip />
        <div className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <WatchZonesPanel />
          <AlertFeatureCard />
        </div>
      </Container>
    </Section>
  );
}

const HOW_IT_WORKS_STEPS: {
  icon: ReactNode;
  title: string;
  desc: string;
}[] = [
  {
    icon: <CalendarIcon className="h-8 w-8" />,
    title: "Post a shift",
    desc: "Add time, pay, and location in minutes.",
  },
  {
    icon: (
      <span className="relative">
        <BellIcon className="h-8 w-8" />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-sage" />
      </span>
    ),
    title: "Notify & alert",
    desc: "Qualified ODs get instant alerts.",
  },
  {
    icon: <UsersIcon className="h-8 w-8" />,
    title: "Match & apply",
    desc: "Optometrists apply in one tap.",
  },
  {
    icon: <ShieldCheckIcon className="h-8 w-8" />,
    title: "Verify",
    desc: "We verify licenses within 24 hours.",
  },
  {
    icon: <CircleCheckIcon className="h-8 w-8" />,
    title: "Covered",
    desc: "You're covered. Everyone wins.",
  },
];

function HowItWorksStrip() {
  return (
    <div>
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
          How it works
        </div>
        <h2 className="font-display mt-3 text-[40px] font-medium leading-[1.05] text-ink md:text-[56px]">
          From shift to <em className="italic text-rust">filled.</em>
        </h2>
        <p className="mx-auto mt-3 max-w-[540px] text-[19px] leading-[1.5] text-ink-2">
          Post once. Notify qualified optometrists. Get covered.
        </p>
      </div>

      {/* lg+: row with dotted-arrow connectors */}
      <div className="mt-12 hidden items-start lg:flex">
        {HOW_IT_WORKS_STEPS.map((step, i) => (
          <Fragment key={step.title}>
            {i > 0 && (
              <div className="relative mx-2 mt-10 flex-1 border-t-2 border-dotted border-[rgba(30,155,227,0.45)]">
                <ArrowRightIcon className="absolute -right-1 -top-[9px] h-4 w-4 text-rust" />
              </div>
            )}
            <HowItWorksStep step={step} index={i} />
          </Fragment>
        ))}
      </div>

      {/* below lg: simple grid, no connectors */}
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:hidden">
        {HOW_IT_WORKS_STEPS.map((step, i) => (
          <HowItWorksStep key={step.title} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}

function HowItWorksStep({
  step,
  index,
}: {
  step: (typeof HOW_IT_WORKS_STEPS)[number];
  index: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(30,155,227,0.35)] bg-white text-rust shadow-[0_2px_8px_rgba(27,42,78,0.08)]">
        {step.icon}
        <span className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-rust text-xs font-semibold text-white">
          {index + 1}
        </span>
      </div>
      <h3 className="font-display mt-5 text-[17px] font-semibold text-ink">
        {step.title}
      </h3>
      <p className="mt-1 max-w-[190px] text-[13px] leading-[1.5] text-ink-2">
        {step.desc}
      </p>
    </div>
  );
}

function WatchZonesPanel() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-paper-deep p-7 lg:p-9">
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-16 h-64 w-64 bg-[radial-gradient(closest-side,rgba(30,155,227,0.32),transparent)] blur-2xl"
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
            The mechanic that earns the name
          </div>
          <h2 className="font-display mt-3.5 text-[40px] font-medium leading-[1.05] text-[#f4f7fc] lg:text-[52px]">
            Watch <em className="italic text-rust">zones.</em>
          </h2>
          <p className="mt-4 text-[17px] leading-[1.55] text-[#a8b3c6]">
            ODs draw where and when they would actually work. Practices post a
            shift. If the post lands inside an OD&apos;s zone, their phone
            buzzes.
          </p>
          <div className="mt-6">
            <MarketingButton href="/how-it-works" variant="primary" size="md">
              See how zones work →
            </MarketingButton>
          </div>
        </div>

        <ZonePhoneVisual />
      </div>

      <div className="relative mt-7 flex flex-col divide-y divide-[rgba(255,255,255,0.12)] rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] sm:flex-row sm:divide-x sm:divide-y-0">
        {[
          [<ZapIcon key="z" className="h-4 w-4 shrink-0 text-rust" />, "Minutes to notify"],
          [<TargetIcon key="t" className="h-4 w-4 shrink-0 text-rust" />, "Precise by location"],
          [<SmartphoneIcon key="s" className="h-4 w-4 shrink-0 text-rust" />, "Works on any device"],
        ].map(([icon, label]) => (
          <div
            key={label as string}
            className="flex flex-1 items-center justify-center gap-2 px-3 py-3"
          >
            {icon}
            <span className="text-[12px] leading-tight text-[#cdd6e8]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZonePhoneVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-[340px] lg:min-h-[420px]"
    >
      {/* map backdrop with streets, zone rings, and pins */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[#eef2f8]">
        <svg
          viewBox="0 0 480 420"
          preserveAspectRatio="xMidYMid slice"
          className="block h-full w-full"
        >
          <defs>
            <pattern id="wz-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" stroke="var(--rule)" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="480" height="420" fill="url(#wz-grid)" />
          {/* streets */}
          <g stroke="var(--rule-strong)" strokeWidth="1.5" opacity="0.5">
            <path d="M0 110 H480" />
            <path d="M0 300 H480" />
            <path d="M130 0 V420" />
            <path d="M360 0 V420" />
            <path d="M0 200 C140 180 320 230 480 195" strokeWidth="1" />
          </g>
          {/* watch-zone rings */}
          <g>
            <circle cx="240" cy="215" r="58" fill="rgba(30,155,227,0.08)" stroke="var(--rust)" strokeOpacity="0.5" strokeWidth="1.5" />
            <circle cx="240" cy="215" r="98" fill="none" stroke="var(--rust)" strokeOpacity="0.3" strokeWidth="1.5" />
            <circle cx="240" cy="215" r="140" fill="none" stroke="var(--sage)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 6" />
          </g>
          {/* center pin */}
          <g transform="translate(240,215)">
            <path
              d="M0 14 C-11 0 -13 -5 -13 -12 A13 13 0 1 1 13 -12 C13 -5 11 0 0 14 Z"
              fill="var(--rust)"
            />
            <circle cy="-11" r="5" fill="white" />
          </g>
          {/* scattered pins */}
          {[
            [70, 70, 0.9],
            [395, 95, 0.8],
            [80, 330, 0.8],
            [410, 320, 0.9],
            [320, 60, 0.7],
            [165, 365, 0.7],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity="0.85">
              <path
                d="M0 10 C-8 0 -9 -4 -9 -9 A9 9 0 1 1 9 -9 C9 -4 8 0 0 10 Z"
                fill="var(--rust)"
              />
              <circle cy="-8" r="3.5" fill="white" />
            </g>
          ))}
        </svg>
      </div>

      {/* phone silhouette — interior transparent so the map shows through */}
      <div className="absolute left-1/2 top-1/2 h-[88%] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-[36px] border-[6px] border-[#10182b] shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
        <span className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#10182b]" />
      </div>

      {/* notification toast */}
      <div className="absolute left-0 top-[7%] w-[min(250px,88%)] rounded-xl border border-rule bg-paper-card p-3 shadow-[0_16px_40px_rgba(27,42,78,0.25)]">
        <div className="flex items-center gap-1.5">
          <Image
            src="/notifeyes-mark.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 object-contain"
          />
          <span className="text-[12px] font-semibold text-ink">NotifEyes</span>
          <span className="ml-auto text-[11px] text-ink-3">now</span>
        </div>
        <div className="mt-1.5 text-[13px] font-semibold text-ink">
          New shift in your zone
        </div>
        <div className="text-[12px] text-ink-2">
          Bayview Eye Care · Today · 8:00 AM
        </div>
        <div className="mt-0.5 text-[11px] text-ink-3">Tap to view and apply</div>
      </div>

      {/* shift card */}
      <div className="absolute bottom-[6%] left-[4%] w-[min(230px,85%)] rounded-xl border border-rule bg-paper-card p-3.5 shadow-[0_16px_40px_rgba(27,42,78,0.25)]">
        <div className="text-[14px] font-semibold text-ink">Bayview Eye Care</div>
        <div className="mt-1 text-[12px] text-ink-2">
          Today · 8:00 AM – 5:00 PM
        </div>
        <div className="text-[12px] text-ink-2">
          Geary Blvd · San Francisco, CA
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-sage">$95/hr</span>
          <span className="inline-flex items-center justify-center rounded-full bg-rust px-3.5 py-1.5 text-[12px] font-medium text-white">
            View shift
          </span>
        </div>
      </div>
    </div>
  );
}

function AlertFeatureCard() {
  const rows: { icon: ReactNode; title: string; desc: string }[] = [
    {
      icon: (
        <span className="relative">
          <BellIcon className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-rust-soft bg-sage" />
        </span>
      ),
      title: "Smart alerts",
      desc: "The right ODs, at the right time. Fewer random pings.",
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      title: "Team aware",
      desc: "Everyone on your team stays in the loop.",
    },
    {
      icon: <ClockIcon className="h-5 w-5" />,
      title: "Always on time",
      desc: "Built for last-minute shifts and busy schedules.",
    },
  ];
  return (
    <div className="flex flex-col justify-center divide-y divide-rule rounded-2xl border border-rule bg-paper-card p-6 lg:p-7">
      {rows.map((row) => (
        <div key={row.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rust-soft text-rust">
            {row.icon}
          </span>
          <div>
            <h3 className="font-display text-[17px] font-semibold text-ink">
              {row.title}
            </h3>
            <p className="mt-1 text-sm leading-[1.5] text-ink-2">{row.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Compare() {
  return (
    <Section>
      <Container>
        <div className="mb-9 max-w-[640px]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Vs. the alternatives
          </div>
          <h2
            className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
          >
            We know what you&apos;re{" "}
            <em
              className="italic"
            >
              used to.
            </em>
          </h2>
          <p className="mt-3.5 text-[19px] leading-[1.5] text-ink-2">
            Here&apos;s how the existing options stack up against NotifEyes.
            Honestly.
          </p>
        </div>

        <CompareTable
          columns={["Group text", "Staffing agency", "NotifEyes"]}
          highlightIndex={2}
          rows={[
            {
              label: "Speed to coverage",
              cells: [
                { text: "Hours · maybe" },
                { text: "Days" },
                { text: "Minutes", tone: "yes" },
              ],
            },
            {
              label: "Vetted licenses",
              cells: [
                { text: "Trust-based", tone: "no" },
                { text: "Yes", tone: "yes" },
                { text: "Yes · automated", tone: "yes" },
              ],
            },
            {
              label: "Cost to practice",
              cells: [
                { text: "Free · social capital" },
                { text: "15–22% markup" },
                { text: `${MARKETING_MATCH_FEE_DISPLAY} flat`, tone: "yes" },
              ],
            },
            {
              label: "OD pay",
              cells: [
                { text: "Cash · favor" },
                { text: "~70% of rate" },
                { text: "100% of agreed rate, direct", tone: "yes" },
              ],
            },
            {
              label: "Written contract",
              cells: [
                { text: "No", tone: "no" },
                { text: "Yes", tone: "yes" },
                { text: "Click-through · auto", tone: "yes" },
              ],
            },
            {
              label: "Cancellation policy",
              cells: [
                { text: "Awkward", tone: "no" },
                { text: "Buried" },
                { text: "On the record · both sides", tone: "yes" },
              ],
            },
            {
              label: "Reviews · both sides",
              cells: [
                { text: "No", tone: "no" },
                { text: "One-way", tone: "no" },
                { text: "Blind · both sides", tone: "yes" },
              ],
            },
          ]}
        />
      </Container>
    </Section>
  );
}

function PricingTeaser() {
  return (
    <Section>
      <Container>
        <div className="mb-10 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Pricing
          </div>
          <h2
            className="font-display mt-3.5 text-5xl md:text-[64px] font-medium leading-[1.05] text-ink"
          >
            Free for ODs. Free to post.
          </h2>
          <p className="mx-auto mt-3.5 max-w-[520px] text-[19px] leading-[1.5] text-ink-2">
            One flat per-match fee on the practice side. No agency %, no
            subscription, no surprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TeaserCard
            role="od"
            label="Optometrists"
            price="$0"
            footnote="always · forever"
            bullets={[
              "Watch zones + instant alerts",
              "One-tap apply",
              "Full rate, paid to you directly",
              "Blind reviews",
            ]}
          />
          <TeaserCard
            role="practice"
            label="Practice · posting"
            price="$0"
            footnote="no charge until you book"
            bullets={[
              "Unlimited shift posts",
              "Browse + favorite ODs",
              "Watch-zone broadcast",
              "Team seats",
            ]}
          />
          <TeaserCard
            role="practice"
            label="Practice · per booked shift"
            price={MARKETING_MATCH_FEE_DISPLAY}
            footnote="flat · same-day & urgent included"
            bullets={[
              "Booking + e-signed contract",
              "Fee captured only after the OD shows",
              "You pay the OD directly — no markup",
              "Reliability records on cancellations",
              "Dispute support",
            ]}
            accent
          />
        </div>

        <div className="mt-10 text-center">
          <MarketingButton href="/pricing" variant="default" size="md">
            See full pricing →
          </MarketingButton>
        </div>
      </Container>
    </Section>
  );
}

function TeaserCard({
  role,
  label,
  price,
  footnote,
  bullets,
  accent = false,
}: {
  role: "practice" | "od";
  label: string;
  price: string;
  footnote: string;
  bullets: string[];
  accent?: boolean;
}) {
  const [whole, cents] = price.includes(".")
    ? [price.slice(0, price.indexOf(".")), price.slice(price.indexOf(".") + 1)]
    : [price, null];
  return (
    <article
      className={`relative rounded-card border p-6 ${
        accent ? "bg-rust-soft border-[#a8d5f0]" : "bg-paper-card border-rule"
      }`}
    >
      {accent && (
        <div className="absolute -top-3 right-5">
          <Chip variant="solid">Day-one price · locked</Chip>
        </div>
      )}
      <RoleBadge role={role} />
      <div className="mt-3 text-sm text-ink">{label}</div>
      <h3
        className="font-display mt-1 text-[56px] font-medium leading-[1] text-ink"
      >
        {whole}
        {cents && <span className="text-[36px]">.{cents}</span>}
      </h3>
      <div className={`mt-1 text-xs ${accent ? "text-rust-2" : "text-ink-3"}`}>
        {footnote}
      </div>
      <hr className="my-5 border-t border-rule" />
      <ul className={`m-0 pl-4 text-sm ${accent ? "text-ink" : "text-ink-2"}`}>
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </article>
  );
}

function FinalCTA() {
  return (
    <Section variant="dark">
      <Container className="text-center">
        <h2
          className="font-display mx-auto max-w-[900px] text-[44px] sm:text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
        >
          One marketplace.{" "}
          <em
            className="italic"
          >
            Two doors.
          </em>
        </h2>
        <p className="mx-auto mt-4 max-w-[540px] text-[19px] leading-[1.5] text-[#a8b3c6]">
          Two-minute sign up. ODs always free. Practices pay only when they book.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
            I&apos;m a practice →
          </MarketingButton>
          <MarketingButton
            href="/signup?role=od"
            size="lg"
            className="!border-[#efe6d2] !text-[#efe6d2] hover:!bg-[#efe6d2] hover:!text-ink"
          >
            I&apos;m an optometrist →
          </MarketingButton>
        </div>
      </Container>
    </Section>
  );
}
