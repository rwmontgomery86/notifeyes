import { Container } from "./Container";
import { Section } from "./Section";
import { MarketingButton } from "./MarketingButton";

export function FinalCTA({
  headline,
  italicTail,
  subhead,
  decorated = false,
}: {
  headline?: string;
  italicTail?: string;
  subhead?: string;
  decorated?: boolean;
} = {}) {
  const headlineText = headline ?? "One marketplace.";
  const tail = italicTail ?? "Two doors.";
  return (
    <Section variant="dark" className={decorated ? "relative overflow-hidden" : ""}>
      {decorated && <CtaDecorations />}
      <Container className="relative text-center">
        <h2
          className="font-display mx-auto max-w-[900px] text-[44px] sm:text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
        >
          {headlineText}{" "}
          <em
            className={`italic ${decorated ? "text-rust" : ""}`}
          >
            {tail}
          </em>
        </h2>
        {subhead && (
          <p className="mx-auto mt-4 max-w-[540px] text-[19px] leading-[1.5] text-[#a8b3c6]">
            {subhead}
          </p>
        )}
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

/* Sparkles + dashed watch-zone arcs on the navy background. */
function CtaDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <svg
        viewBox="0 0 600 600"
        fill="none"
        className="absolute -bottom-[380px] -left-[200px] h-[600px] w-[600px]"
      >
        <circle
          cx="300"
          cy="300"
          r="220"
          stroke="var(--rust)"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeDasharray="3 10"
        />
        <circle
          cx="300"
          cy="300"
          r="290"
          stroke="var(--rust)"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeDasharray="3 10"
        />
      </svg>
      <svg
        viewBox="0 0 600 600"
        fill="none"
        className="absolute -right-[240px] -top-[400px] h-[600px] w-[600px]"
      >
        <circle
          cx="300"
          cy="300"
          r="250"
          stroke="var(--rust)"
          strokeOpacity="0.2"
          strokeWidth="2"
          strokeDasharray="3 10"
        />
      </svg>
      <CtaSparkle className="left-[16%] top-[22%] h-4 w-4" />
      <CtaSparkle className="right-[14%] top-[30%] h-3 w-3 opacity-70" />
      <CtaSparkle className="bottom-[24%] right-[22%] h-4 w-4 opacity-80" />
    </div>
  );
}

function CtaSparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`absolute text-rust ${className}`}
      fill="currentColor"
    >
      <path d="M12 0c.9 5.6 2.6 8.4 3.4 9.2.8.8 3.6 2.4 8.6 2.8-5 .4-7.8 2-8.6 2.8-.8.8-2.5 3.6-3.4 9.2-.9-5.6-2.6-8.4-3.4-9.2C7.8 14 5 12.4 0 12c5-.4 7.8-2 8.6-2.8C9.4 8.4 11.1 5.6 12 0z" />
    </svg>
  );
}
