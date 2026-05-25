import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Chip } from "@/components/marketing/Chip";

export const metadata: Metadata = {
  title: "About — NotifEyes",
  description:
    "We're putting the optometry group text on rails. Built by an OD who's done a Tuesday.",
};

const BELIEFS = [
  "Optometry staffing is not a logistics problem. It is a discovery problem.",
  "ODs should be paid 100% of the rate the practice agreed to.",
  "“Vetted” should mean license + ID + DEA — not the agency's gut.",
  "Software should reduce the amount of personal favor-asking. Not increase it.",
];

const TEAM = [
  { name: "[Dr. Founder]", role: "Founder · OD", tag: "12 yrs OD" },
  { name: "[Co-founder]", role: "Co-founder · Engineering", tag: "ex-[Big tech]" },
  { name: "[Designer]", role: "Design", tag: "ex-[Studio]" },
  { name: "[Ops lead]", role: "Ops + verification", tag: "Licensed RN" },
];

const MILESTONES: [string, string, string][] = [
  ["2026 · Q1", "Discovery.", "First interviews — 40 ODs, 22 practices. Hypothesis confirmed."],
  ["2026 · Q2", "Design.", "Wireframes, hi-fi, handoff brief. This design pass."],
  ["2026 · Q3", "Closed beta.", "SF Bay metro. 30 practices, 80 ODs."],
  ["2026 · Q4", "Public V1 launch.", "Open signup. $9.99 day-one."],
  ["2027 · H1", "V2.", "Stripe Connect, recurring shifts, second metro."],
];

export default function AboutPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-rule py-20">
        <Container>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            About
          </div>
          <h1
            className="font-display mt-4 max-w-[920px] text-[56px] md:text-[88px] font-medium leading-[0.97] text-ink"
          >
            We&apos;re putting the optometry{" "}
            <em
              className="italic"
            >
              group text on rails.
            </em>
          </h1>
          <p className="mt-6 max-w-[620px] text-[22px] leading-[1.5] text-ink-2">
            Optometry has a fill-in network. It runs over text. We&apos;re not
            trying to replace it — we&apos;re trying to give it a UI, a contract,
            and a payout. So the network can scale past the people you went to
            school with.
          </p>
        </Container>
      </section>

      {/* Why this, why us */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-14">
            <div className="aspect-[4/5] flex items-center justify-center rounded-card border border-dashed border-rule-strong bg-paper-card font-mono text-xs text-ink-3 text-center px-6">
              [ editorial portrait · founder + OD · clinic doorway ]
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
                Why this, why us
              </div>
              <h2
                className="font-display mt-3.5 text-5xl md:text-[48px] font-medium leading-[1.05] text-ink"
              >
                Built by someone{" "}
                <em
                  className="italic"
                >
                  who&apos;s done a Tuesday.
                </em>
              </h2>
              <p className="mt-5 text-[19px] leading-[1.5] text-ink-2">
                Practicing OD for [X] years. Watched too many practices reschedule
                a day of patients because no one answered the group text in time.
                Watched too many ODs miss good shifts because they weren&apos;t on
                the right Facebook group.
              </p>
              <p className="mt-3.5 text-base leading-[1.7] text-ink-2">
                The fill-in network was real — and trapped in DMs. NotifEyes is
                the network with a UI, a contract, and a payout that actually
                happens. We&apos;re keeping it small until V1 ships. Then we go
                wide.
              </p>

              <div className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-rust">
                What we believe
              </div>
              <ul className="m-0 mt-3.5 flex list-none flex-col gap-3 p-0">
                {BELIEFS.map((l) => (
                  <li key={l} className="grid grid-cols-[14px_1fr] gap-3 text-base text-ink">
                    <span className="mt-2 h-2 w-2 rounded-full bg-sage" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section variant="alt">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              The team
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[56px] font-medium leading-[1.05] text-ink"
            >
              Small. Built{" "}
              <em
                className="italic"
              >
                for shipping V1.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEAM.map((p) => (
              <article
                key={p.name}
                className="flex flex-col gap-2.5 rounded-card border border-rule bg-paper-card p-5"
              >
                <div className="aspect-square rounded-md border border-rule bg-paper-2 flex items-center justify-center font-mono text-xs text-ink-3">
                  [portrait]
                </div>
                <div>
                  <strong className="text-[15px] text-ink">{p.name}</strong>
                  <div className="mt-0.5 text-xs text-ink-3">{p.role}</div>
                </div>
                <div className="self-start">
                  <Chip variant="sage" className="!text-[11px]">
                    {p.tag}
                  </Chip>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Milestones */}
      <Section>
        <Container>
          <div className="mb-6 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Milestones
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[56px] font-medium leading-[1.05] text-ink"
            >
              The road{" "}
              <em
                className="italic"
              >
                to V1.
              </em>
            </h2>
          </div>
          <table className="w-full border-separate border-spacing-0 text-sm">
            <tbody>
              {MILESTONES.map(([when, head, body]) => (
                <tr key={when}>
                  <td className="border-b border-rule py-4 px-[18px] align-top w-[140px] font-mono text-xs text-ink-3">
                    {when}
                  </td>
                  <td className="border-b border-rule py-4 px-[18px] align-top text-ink-2">
                    <strong className="text-ink">{head}</strong> {body}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Container>
      </Section>

      <FinalCTA />
      <SiteFooter />
    </div>
  );
}
