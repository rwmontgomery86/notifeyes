"use client";

export type Audience = "practice" | "od";

export function AudienceToggle({
  value,
  onChange,
}: {
  value: Audience;
  onChange: (next: Audience) => void;
}) {
  const isPractice = value === "practice";
  return (
    <div className="inline-flex items-center gap-0 rounded-full border border-ink bg-paper-card p-1">
      <button
        type="button"
        onClick={() => onChange("practice")}
        className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
          isPractice ? "bg-ink text-paper-card" : "text-ink-2 hover:text-ink"
        }`}
      >
        I&apos;m a practice
      </button>
      <button
        type="button"
        onClick={() => onChange("od")}
        className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
          !isPractice ? "bg-rust text-white" : "text-ink-2 hover:text-ink"
        }`}
      >
        I&apos;m an optometrist
      </button>
    </div>
  );
}
