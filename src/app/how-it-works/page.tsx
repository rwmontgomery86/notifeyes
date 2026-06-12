import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { MarketingButton } from "@/components/marketing/MarketingButton";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Chip } from "@/components/marketing/Chip";
import {
  BroadcastDiagram,
  ZonePolygonDiagram,
} from "@/components/marketing/diagrams";

export const metadata: Metadata = {
  title: "How it works — NotifEyes",
  description:
    "The whole loop, in plain English. Two sides, one marketplace — post, match, contract, pay, review.",
};

type Owner = "practice" | "od" | "system";
const SPINE: { n: string; t: string; d: string; who: Owner }[] = [
  { n: "01", t: "Post", d: "Practice creates a shift draft. Date, hours, rate, services, EHR, notes.", who: "practice" },
  { n: "02", t: "Broadcast", d: "We match the shift to OD watch zones. Email + SMS per their preference, in seconds.", who: "system" },
  { n: "03", t: "Apply", d: "ODs read the shift detail, tap apply. Optional message + availability note.", who: "od" },
  { n: "04", t: "Book", d: "Practice picks. Confirms cost. Contract auto-signed via click-through.", who: "practice" },
  { n: "05", t: "Work", d: "The OD works the shift. The practice confirms they showed up — that's what captures our fee.", who: "od" },
  { n: "06", t: "Pay + review", d: "Practice pays the OD directly — full rate, no middleman. Both sides prompted to review (blind, 7-day).", who: "system" },
];

function ownerChip(who: Owner) {
  if (who === "practice") return <Chip>Practice</Chip>;
  if (who === "od") return <Chip variant="accent">OD</Chip>;
  return <Chip variant="sage">System</Chip>;
}

const OD_CONFIG: [string, string][] = [
  ["Geometry", "Polygon, or circle around home / work."],
  ["Days of week", "Tue / Thu / Sat only, whatever."],
  ["Rate floor", "Min $/hr."],
  ["Shift types", "Fill-in · half-day · weekend."],
  ["Channels", "Email, SMS — per zone."],
  ["Pause", "Mute zones without deleting them."],
];

const PRACTICE_SEES: [string, string][] = [
  ["Reach estimate", '"[xx] ODs watching this area" at post time.'],
  ["Broadcast confirm", '"Alerts sent to [n] ODs" after publishing.'],
  ["Applicant stream", "Apps flow into the shift admin pipeline live."],
  ["Bump tool", "Auto-widen radius if no apps in 4 hours."],
  ["Direct invite", "Skip the queue — invite favorites direct."],
];

const SIDE_PATHS: { t: string; d: string }[] = [
  {
    t: "Direct invite",
    d: "Practice has a favorite OD. Application created with status=offered. OD accepts → instant booking, no queue.",
  },
  {
    t: "Cancellation",
    d: "No platform fee. The cancellation goes on the cancelling side's reliability record — the closer to the shift, the more serious. Shift can be re-posted with urgent flag.",
  },
  {
    t: "No-show",
    d: "Practice reports it — the match fee is never captured, so the practice pays nothing. The no-show goes on the OD's record. Backup ODs surfaced.",
  },
];

const GLOSSARY: [string, string][] = [
  ["Watch zone", "A geographic + filter rule an OD sets. Matching shifts ping them."],
  ["Shift", "A posted slot: date, hours, rate, services."],
  ["Application", "An OD's intent on a shift. Source can be apply, invite, or watch-alert."],
  ["Booking", "Confirmed match. Triggers contract + payment auth."],
  ["Closeout", "Attendance confirm + fee capture + review prompts."],
  ["Blind review", "Both sides write. Neither reads until both submit (or 7 days pass)."],
];

export default function HowItWorksPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader activeKey="how" />

      {/* Hero */}
      <section className="border-b border-rule py-16">
        <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center px-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              How it works
            </div>
            <h1
              className="font-display mt-4 text-[56px] md:text-[80px] font-medium leading-[0.97] text-ink"
            >
              The whole loop,{" "}
              <em
                className="italic"
              >
                in plain English.
              </em>
            </h1>
            <p className="mt-5 max-w-[480px] text-[19px] leading-[1.5] text-ink-2">
              Two sides. One marketplace. We post, match, contract, pay, review.
              Here&apos;s every step — what happens, who sees what, when.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MarketingButton href="/signup?role=practice" variant="primary" size="lg">
                Start as a practice →
              </MarketingButton>
              <MarketingButton href="/signup?role=od" size="lg">
                Start as an OD
              </MarketingButton>
            </div>
          </div>
          <div className="aspect-[5/4] overflow-hidden rounded-lg border border-rule">
            <BroadcastDiagram />
          </div>
        </div>
      </section>

      {/* The spine */}
      <Section variant="dark">
        <Container>
          <div className="mb-10 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
              The spine
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-[#f4f7fc]"
            >
              From open chair{" "}
              <em
                className="italic"
              >
                to paid OD.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SPINE.map((s) => (
              <article
                key={s.n}
                className="rounded-card border border-rule bg-paper-card p-6 text-ink"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-xs text-rust tracking-[0.04em]">
                    {s.n}
                  </div>
                  {ownerChip(s.who)}
                </div>
                <h3 className="font-display mt-3 text-2xl text-ink">{s.t}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{s.d}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Watch zones in detail */}
      <Section>
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              The acquisition lever
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
            >
              Watch zones,{" "}
              <em
                className="italic"
              >
                in detail.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailCard role="od" title="OD configures" rows={OD_CONFIG} keyWidth="110px" />
            <DetailCard role="practice" title="Practice sees" rows={PRACTICE_SEES} keyWidth="120px" />
          </div>
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="aspect-[5/3] overflow-hidden rounded-lg border border-rule">
              <ZonePolygonDiagram />
            </div>
            <div className="aspect-[5/3] overflow-hidden rounded-lg border border-rule">
              <BroadcastDiagram />
            </div>
          </div>
        </Container>
      </Section>

      {/* Side paths */}
      <Section variant="alt">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Side paths
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[56px] font-medium leading-[1.05] text-ink"
            >
              When things don&apos;t go to plan.
            </h2>
            <p className="mt-3.5 text-[19px] leading-[1.5] text-ink-2">
              The happy path covers ~85% of bookings. Here&apos;s what happens for
              the other 15%.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SIDE_PATHS.map((s, i) => (
              <article
                key={s.t}
                className="rounded-card border border-rule bg-paper-card p-6"
              >
                <div className="font-mono text-xs text-rust tracking-[0.04em]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display mt-2 text-[22px] text-ink">{s.t}</h3>
                <p className="mt-2 text-sm text-ink-2 leading-[1.6]">{s.d}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Glossary */}
      <Section>
        <Container>
          <div className="mb-6 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Glossary
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[56px] font-medium leading-[1.05] text-ink"
            >
              Plain-English{" "}
              <em
                className="italic"
              >
                definitions.
              </em>
            </h2>
          </div>
          <table className="w-full border-separate border-spacing-0 text-sm">
            <tbody>
              {GLOSSARY.map(([term, def]) => (
                <tr key={term}>
                  <td className="border-b border-rule py-4 px-[18px] align-top w-[200px]">
                    <strong className="text-ink">{term}</strong>
                  </td>
                  <td className="border-b border-rule py-4 px-[18px] align-top text-ink-2">
                    {def}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      <FinalCTA subhead="Two-minute sign up. ODs always free. Practices pay only when they book." />
      <SiteFooter />
    </div>
  );
}

function DetailCard({
  role,
  title,
  rows,
  keyWidth,
}: {
  role: "od" | "practice";
  title: string;
  rows: [string, string][];
  keyWidth: string;
}) {
  return (
    <article className="rounded-card border border-rule bg-paper-card p-6">
      <Chip variant={role === "od" ? "accent" : "default"}>{title}</Chip>
      <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
        {rows.map(([k, v], i) => (
          <li
            key={k}
            className={`grid items-start gap-4 pb-2.5 text-sm ${
              i === rows.length - 1 ? "" : "border-b border-dashed border-rule"
            }`}
            style={{ gridTemplateColumns: `${keyWidth} 1fr` }}
          >
            <strong className="text-ink">{k}</strong>
            <span className="text-ink-2">{v}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

