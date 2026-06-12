import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { Chip } from "@/components/marketing/Chip";
import { RoleBadge } from "@/components/marketing/RoleBadge";
import { CompareTable } from "@/components/marketing/CompareTable";
import { HomeHero } from "@/components/marketing/HomeHero";
import {
  BroadcastDiagram,
  PhonePingDiagram,
  ZonePolygonDiagram,
} from "@/components/marketing/diagrams";
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
      <ProofBar />
      <ShiftTicker state={detected} />
      <WhyBoth />
      <WatchZoneSection />
      <Compare />
      <PricingTeaser />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

export const dynamic = "force-dynamic";

function ProofBar() {
  const stats = [
    { n: "< 10s", l: "from shift post to first ping" },
    { n: "8 min", l: "median first application" },
    { n: "24 hr", l: "license verification SLA" },
    { n: MARKETING_MATCH_FEE_DISPLAY, l: "per match · flat, no %" },
  ];
  return (
    <section className="border-b border-rule bg-paper-2">
      <div className="max-w-wide mx-auto grid grid-cols-2 md:grid-cols-4 gap-7 px-7 py-8">
        {stats.map((s) => (
          <div key={s.l}>
            <div
              className="font-display text-5xl font-medium leading-[0.96] text-ink tracking-[-0.02em]"
            >
              {s.n}
            </div>
            <div className="mt-1 text-[13px] text-ink-2">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

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
        <div className="mb-12 max-w-[720px]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Why both sides stay
          </div>
          <h2
            className="font-display mt-3.5 text-[56px] md:text-[72px] font-medium leading-[1.05] text-ink"
          >
            Practices post. ODs watch. The match happens.
          </h2>
          <p className="mt-4 max-w-[580px] text-[19px] leading-[1.5] text-ink-2">
            The thing that makes NotifEyes work for practices is the same thing
            that makes it work for ODs: shifts go find the right person. The
            person doesn&apos;t have to go find them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="rounded-card border border-rule bg-paper-card p-6">
            <RoleBadge role="practice" />
            <h3 className="font-display mt-3.5 text-[26px] text-ink">
              Post once. The right ODs apply.
            </h3>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
              {[
                ["Post in 90 seconds", "Pulls from your existing scheduler. Five fields, then publish."],
                ["Vetted ODs only", "License + DEA + ID, all verified before they can apply."],
                [`${MARKETING_MATCH_FEE_DISPLAY} per booked shift`, "Flat. No %, no markup, no agency middle-cut."],
                ["Cancel policy, written down", "7-day, 48-hr, 4-hr tiers. We enforce them so you're not chasing anyone."],
              ].map(([h, d]) => (
                <li key={h} className="grid grid-cols-[16px_1fr] gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-rust" />
                  <span className="text-ink">
                    <strong>{h}.</strong>{" "}
                    <span className="text-sm text-ink-2">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-card border border-[#a8d5f0] bg-rust-soft p-6">
            <RoleBadge role="od" />
            <h3 className="font-display mt-3.5 text-[26px] text-ink">
              Set zones once. The right shifts find you.
            </h3>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
              {[
                ["Watch zones", "Draw where you would actually drive. Filter by day, rate, EHR."],
                ["One-tap apply", "Read the contract in the app. Apply with a single tap."],
                ["Free, always", "Zero fees on the OD side. Forever. You get 100% of the agreed rate."],
                ["Paid directly, in full", "The practice pays your full rate straight to you — no platform cut, tracked on your dashboard."],
              ].map(([h, d]) => (
                <li key={h} className="grid grid-cols-[16px_1fr] gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-rust" />
                  <span className="text-ink">
                    <strong>{h}.</strong>{" "}
                    <span className="text-sm text-ink-2">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Container>
    </Section>
  );
}

function WatchZoneSection() {
  return (
    <Section variant="dark">
      <Container>
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
              The mechanic that earns the name
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[72px] font-medium leading-[1.05] text-[#f4f7fc]"
            >
              Watch{" "}
              <em
                className="italic"
              >
                zones.
              </em>
            </h2>
            <p className="mt-4 text-[19px] leading-[1.5] text-[#a8b3c6]">
              ODs draw where and when they would actually work. Practices post a
              shift. If the post lands inside an OD&apos;s zone, their phone
              buzzes.
            </p>
            <p className="mt-3.5 text-sm leading-[1.6] text-[#a8b3c6]">
              No more browsing job boards. No more Facebook groups. No more being
              last to know about the good Tuesday shift.
            </p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-card border border-white/10">
            <BroadcastDiagram />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: "01",
              t: "Draw the zones.",
              d: "Polygon or circle. Multiple zones, each with its own filters and notification channels.",
              diagram: <ZonePolygonDiagram />,
            },
            {
              n: "02",
              t: "Filter your taste.",
              d: "Days you would work. Minimum hourly rate. Half-days only. EHRs you actually know.",
              diagram: (
                <div className="flex h-full flex-col justify-center gap-2 bg-paper-card p-6">
                  {[
                    ["Days", "Tue · Thu · Sat"],
                    ["Min rate", "$95/hr"],
                    ["Shift types", "Fill-in · Half-day"],
                    ["EHR", "Crystal · Revolution"],
                  ].map(([k, v], i) => (
                    <div
                      key={k}
                      className={`flex justify-between py-1.5 text-[13px] ${
                        i === 3 ? "" : "border-b border-dashed border-rule"
                      }`}
                    >
                      <span className="font-mono text-xs text-ink-3">{k}</span>
                      <span className="font-medium text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              n: "03",
              t: "Live your life.",
              d: "We ping when something matches. Push, email, SMS. Your call. Quiet hours configurable.",
              diagram: <PhonePingDiagram />,
            },
          ].map((step) => (
            <article
              key={step.n}
              className="overflow-hidden rounded-card border border-rule bg-paper-card text-ink"
            >
              <div className="h-[220px] border-b border-rule">{step.diagram}</div>
              <div className="p-6">
                <div className="font-mono text-xs text-rust tracking-[0.04em]">
                  {step.n}
                </div>
                <h3 className="font-display mt-2 text-[22px] text-ink">{step.t}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{step.d}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
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
          className="font-display mx-auto max-w-[900px] text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
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
