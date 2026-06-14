import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { Container } from "./Container";

export type LegalDoc =
  | "terms"
  | "privacy"
  | "cookies"
  | "acceptable-use"
  | "beta-agreement";

const DOCS: { slug: LegalDoc; label: string; href: string }[] = [
  { slug: "terms", label: "Terms of Service", href: "/legal/terms" },
  { slug: "privacy", label: "Privacy Policy", href: "/legal/privacy" },
  { slug: "cookies", label: "Cookie policy", href: "/legal/cookies" },
  { slug: "acceptable-use", label: "Acceptable use", href: "/legal/acceptable-use" },
  { slug: "beta-agreement", label: "Beta agreement", href: "/legal/beta-agreement" },
];

export function LegalLayout({
  active,
  title,
  intro,
  lastUpdated = "[May 2026]",
  version = "v1.0",
  children,
}: {
  active: LegalDoc;
  title: string;
  intro: string;
  lastUpdated?: string;
  version?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-paper text-ink min-h-screen">
      <SiteHeader />

      <section className="border-b border-rule py-12">
        <Container>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rust">
            Legal
          </div>
          <h1
            className="font-display mt-3 text-5xl md:text-[64px] font-medium leading-[0.97] text-ink"
          >
            {title}
          </h1>
          <p className="mt-3.5 max-w-[580px] text-[19px] leading-[1.5] text-ink-2">
            {intro}
          </p>
          <div className="mt-4 flex items-center gap-4 text-[13px] text-ink-3">
            <span>Last updated · {lastUpdated}</span>
            <span>{version}</span>
          </div>
        </Container>
      </section>

      <section className="py-10 pb-20">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
            <aside className="md:sticky md:top-6 md:self-start">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-rust">
                Documents
              </div>
              <nav className="flex flex-col gap-0.5">
                {DOCS.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={doc.href}
                    className={`rounded px-3 py-2 text-sm no-underline transition-colors ${
                      doc.slug === active
                        ? "bg-rust-soft text-rust-2 font-medium"
                        : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                    }`}
                  >
                    {doc.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <div>{children}</div>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </div>
  );
}

export function LegalSection({ heading, body }: { heading: string; body: ReactNode }) {
  return (
    <div className="mb-8">
      <h3
        className="font-display border-b border-dashed border-rule pb-2 text-[22px] font-semibold text-ink"
      >
        {heading}
      </h3>
      <p className="mt-3 text-base leading-[1.7] text-ink-2">{body}</p>
    </div>
  );
}

export function LegalTodo() {
  return (
    <div className="rounded-card border border-[#a8d5f0] bg-rust-soft px-4 py-3 text-sm text-rust-2 mb-6">
      {/* --TODO: legal review --- attorney-drafted final language */}
      Draft for review. Final language pending legal counsel before any real
      launch. The structure below is what we&apos;ll publish.
    </div>
  );
}
