import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Chip } from "@/components/marketing/Chip";
import { RoleBadge } from "@/components/marketing/RoleBadge";

export const metadata: Metadata = {
  title: "Trust & safety — NotifEyes",
  description:
    "Verified ODs. Real contracts. Money where you can see it. The trust mechanics behind NotifEyes.",
};

const TRUST_CARDS: { t: string; d: string; tag: string }[] = [
  { t: "License verified", d: "State board API + manual fallback", tag: "24-hr SLA" },
  { t: "Stripe payments", d: "PCI inherited · we never touch card data", tag: "PCI" },
  { t: "Blind reviews", d: "Both sides write before either reads", tag: "Fair" },
  { t: "No PHI on platform", d: "ODs document in your EHR, not ours", tag: "HIPAA-safe" },
];

const OD_VERIFICATION: { h: string; d: string }[] = [
  { h: "License", d: "Verified against the state board database (auto where the API exists, manual queue otherwise). 24-hr SLA." },
  { h: "ID", d: "Government photo ID, name-matched to the license record." },
  { h: "DEA", d: "Optional. Displayed on profile if uploaded." },
  { h: "Malpractice", d: "Optional. Practices can require it as a filter." },
  { h: "NPI", d: "Verified via NPPES at signup." },
];

const PRACTICE_VERIFICATION: { h: string; d: string }[] = [
  { h: "Business license", d: "Verified at signup." },
  { h: "Address", d: "Matched against published practice records." },
  { h: "Payment method", d: "Verified card or ACH on file before posting." },
  { h: "Owner identity", d: "We know who actually runs the practice." },
];

const MONEY: { t: string; d: string }[] = [
  { t: "Authorized at booking", d: "Practice card or ACH authorized when the shift books. Funds reserved, not yet captured." },
  { t: "Captured at completion", d: "After shift check-out. Held 24 hours for dispute window before release." },
  { t: "OD payout in 3 days", d: "ACH initiated 3 business days after the shift. Visible on payouts dashboard the whole way." },
  { t: "Refunds policy", d: "Spelled out below. We charge fees from the practice and pay the OD. You don't chase anyone." },
  { t: "No PHI on platform", d: "We never store patient data. ODs chart in your EHR — we just match and pay." },
  { t: "Stripe-handled", d: "Stripe processes all payments. We never touch raw card data. PCI by inheritance." },
];

const CANCELLATION: {
  when: string;
  practice: { text: string; tone?: "yes" | "no" };
  od: { text: string; tone?: "yes" | "no" };
  repost: string;
}[] = [
  { when: "> 7 days out", practice: { text: "No fee · full refund", tone: "yes" }, od: { text: "No fee · OD flag (light)" }, repost: "Yes, normal" },
  { when: "2–7 days out", practice: { text: "25% of shift paid to OD" }, od: { text: "$25 cancel fee · OD flag" }, repost: "Yes, urgent flag" },
  { when: "< 48 hr", practice: { text: "50% of shift paid to OD" }, od: { text: "$75 cancel fee · OD flag" }, repost: "Yes, urgent flag" },
  { when: "< 4 hr / no-show", practice: { text: "100% of shift paid to OD" }, od: { text: "Suspension review", tone: "no" }, repost: "Auto-urgent + backup push" },
];

const DISPUTES: { t: string; d: string }[] = [
  { t: "Report", d: "Either side flags within 72 hours of shift end." },
  { t: "Pause", d: "Payout paused. Both sides invited to comment." },
  { t: "Review", d: "Our team reads. Response within 2 business days." },
  { t: "Resolve", d: "Refund, payout, or split — written and recorded." },
];

export default function TrustSafetyPage() {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-rule py-16">
        <div className="max-w-wide mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 items-center px-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Trust &amp; safety
            </div>
            <h1
              className="font-display mt-4 text-[56px] md:text-[80px] font-medium leading-[0.97] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Verified ODs.
              <br />
              Real contracts.
              <br />
              <em
                className="not-italic text-sage"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                Money where you can see it.
              </em>
            </h1>
            <p className="mt-5 max-w-[480px] text-[19px] leading-[1.5] text-ink-2">
              Optometry is a regulated profession. We treat it like one. Every OD
              on NotifEyes is license-verified before they apply. Every booking
              has a written contract. Every payout is on a schedule we publish.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {TRUST_CARDS.map((c) => (
              <article
                key={c.t}
                className="rounded-card border border-rule bg-paper-card p-5"
              >
                <Chip variant="sage" className="!text-[11px]">
                  {c.tag}
                </Chip>
                <h4 className="font-display mt-2.5 text-[17px] text-ink">{c.t}</h4>
                <p className="mt-1.5 text-sm text-ink-2 leading-[1.6]">{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <Section id="verification">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Verification
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Who we let on,{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                and how.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VerificationCard role="od" rows={OD_VERIFICATION} badgeLine="License verified · [state] · exp [date]" />
            <VerificationCard role="practice" rows={PRACTICE_VERIFICATION} badgeLine="Verified practice" />
          </div>
        </Container>
      </Section>

      {/* Money */}
      <Section variant="alt">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Money
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Payments are{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                boring, on purpose.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MONEY.map((m) => (
              <article
                key={m.t}
                className="rounded-card border border-rule bg-paper-card p-6"
              >
                <h3 className="font-display text-[19px] text-ink">{m.t}</h3>
                <p className="mt-1.5 text-sm text-ink-2 leading-[1.6]">{m.d}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Cancellation policy */}
      <Section id="cancellation">
        <Container>
          <div className="mb-6 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Cancellation policy
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              When plans change —{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                what it costs.
              </em>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  {["When", "Practice cancels", "OD cancels", "Shift re-posts?"].map((h, i) => (
                    <th
                      key={h}
                      className={`border-b border-ink py-4 px-[18px] text-left font-display text-lg font-semibold text-ink align-top ${
                        i === 0 ? "!font-sans !text-xs !font-medium uppercase !tracking-[0.08em] !text-ink-3" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CANCELLATION.map((row) => (
                  <tr key={row.when}>
                    <td className="border-b border-rule py-4 px-[18px] font-medium align-top text-ink">
                      <strong>{row.when}</strong>
                    </td>
                    <td
                      className={`border-b border-rule py-4 px-[18px] align-top ${
                        row.practice.tone === "yes"
                          ? "text-sage font-semibold"
                          : row.practice.tone === "no"
                            ? "text-ink-3"
                            : "text-ink-2"
                      }`}
                    >
                      {row.practice.text}
                    </td>
                    <td
                      className={`border-b border-rule py-4 px-[18px] align-top ${
                        row.od.tone === "yes"
                          ? "text-sage font-semibold"
                          : row.od.tone === "no"
                            ? "text-ink-3"
                            : "text-ink-2"
                      }`}
                    >
                      {row.od.text}
                    </td>
                    <td className="border-b border-rule py-4 px-[18px] align-top text-ink-2">
                      {row.repost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-3">
            {/* --TODO: legal review --- cancellation percentages and OD-cancel fees */}
            Percentages are V1 placeholders pending legal + market review before
            launch.
          </p>
        </Container>
      </Section>

      {/* Reviews */}
      <Section variant="alt">
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Reviews
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              Honest, because{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                both sides write blind.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-card border border-rule bg-paper-card p-6">
              <h3 className="font-display text-[19px] text-ink">The mechanic</h3>
              <p className="mt-2 text-sm text-ink-2 leading-[1.6]">
                Both sides get a review prompt 2 hours after shift completion.
                Reviews stay hidden from each side until both submit — or 7 days
                pass, whichever comes first. Then they publish together.
              </p>
            </article>
            <article className="rounded-card border border-rule bg-paper-card p-6">
              <h3 className="font-display text-[19px] text-ink">What we rate</h3>
              <ul className="m-0 mt-2 list-disc pl-4 text-sm text-ink-2 space-y-1">
                <li>
                  <strong>OD ← Practice:</strong> overall, on-time, patient care,
                  charting, team fit
                </li>
                <li>
                  <strong>Practice ← OD:</strong> overall, clarity, pay, workflow
                </li>
                <li>Public comment + private feedback (us only)</li>
              </ul>
            </article>
          </div>
        </Container>
      </Section>

      {/* Disputes */}
      <Section>
        <Container>
          <div className="mb-8 max-w-[640px]">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
              Disputes
            </div>
            <h2
              className="font-display mt-3.5 text-5xl md:text-[60px] font-medium leading-[1.05] text-ink"
              style={{ fontVariationSettings: '"SOFT" 30, "WONK" 0' }}
            >
              When something&apos;s off —{" "}
              <em
                className="not-italic"
                style={{ fontVariationSettings: '"SOFT" 30, "WONK" 1', fontStyle: "italic" }}
              >
                what happens.
              </em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {DISPUTES.map((s, i) => (
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

      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function VerificationCard({
  role,
  rows,
  badgeLine,
}: {
  role: "od" | "practice";
  rows: { h: string; d: string }[];
  badgeLine: string;
}) {
  return (
    <article className="rounded-card border border-rule bg-paper-card p-6">
      <RoleBadge role={role} />
      <ul className="m-0 mt-4 flex list-none flex-col gap-3.5 p-0">
        {rows.map((row, i) => (
          <li
            key={row.h}
            className={`grid items-start gap-4 pb-3 text-sm ${
              i === rows.length - 1 ? "" : "border-b border-dashed border-rule"
            }`}
            style={{ gridTemplateColumns: "110px 1fr" }}
          >
            <strong className="text-ink">{row.h}</strong>
            <span className="text-ink-2">{row.d}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 inline-flex">
        <Chip variant="accent" className="!text-xs">
          Profile badge: &ldquo;{badgeLine}&rdquo;
        </Chip>
      </div>
    </article>
  );
}
