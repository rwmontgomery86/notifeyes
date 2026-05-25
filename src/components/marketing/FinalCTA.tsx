import { Container } from "./Container";
import { Section } from "./Section";
import { MarketingButton } from "./MarketingButton";

export function FinalCTA({
  headline,
  italicTail,
  subhead,
}: {
  headline?: string;
  italicTail?: string;
  subhead?: string;
} = {}) {
  const headlineText = headline ?? "One marketplace.";
  const tail = italicTail ?? "Two doors.";
  return (
    <Section variant="dark">
      <Container className="text-center">
        <h2
          className="font-display mx-auto max-w-[900px] text-[64px] md:text-[80px] font-medium leading-[1.05] text-[#f4f7fc]"
        >
          {headlineText}{" "}
          <em
            className="italic"
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
