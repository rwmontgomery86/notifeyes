"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ContourArt } from "./ContourArt";

type Nav = { href: string; label: string; badge?: number };
type Role = "practice_owner" | "practice_scheduler" | "od" | "admin";

const ROLE_LABELS: Record<Role, string> = {
  od: "Optometrist",
  practice_owner: "Practice owner",
  practice_scheduler: "Scheduler",
  admin: "Admin",
};

function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

function initialsFor(name: string | null | undefined): string {
  const words = (name ?? "").replace(/^dr\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]![0]!.toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

// Notifications and Messages live in the top bar as icons; everything else
// stays in the floating panel. Exact match only, so admin's
// "/admin/notifications" nav entry is untouched.
const TOP_BAR_HREFS = ["/notifications", "/messages"];

export function AppShellClient({
  role,
  userName,
  nav,
  signOutSlot,
  children,
}: {
  role: Role;
  userName?: string | null;
  nav: Nav[];
  /** Server-rendered sign-out form (server action), slotted into the panel footer. */
  signOutSlot: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const panelNav = nav.filter((n) => !TOP_BAR_HREFS.includes(n.href));
  const bell = nav.find((n) => n.href === "/notifications");
  const mail = nav.find((n) => n.href === "/messages");

  // Longest matching prefix wins, so e.g. /p/shifts/new doesn't also light up
  // a shorter sibling.
  const activeHref = useMemo(() => {
    const matches = nav.filter(
      (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
    );
    matches.sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href ?? null;
  }, [nav, pathname]);

  // The drawer closes on navigation and on Escape.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const profileHref =
    role === "od" ? "/d/profile" : role === "admin" ? "/me" : "/p/settings";

  const panel = (
    <>
      <Link href="/" className="flex items-center gap-2.5 px-5 pb-4 pt-6">
        <Image
          src="/notifeyes-mark.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
        <span className="text-sm font-semibold text-white">
          Notif<span className="text-rust">Eyes</span>
        </span>
      </Link>

      <nav className="mt-2 flex flex-1 flex-col gap-1.5 px-3">
        {panelNav.map((n) => {
          const isActive = n.href === activeHref;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex h-10 items-center justify-between rounded-full px-4 text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
                isActive
                  ? "bg-rust font-medium text-white shadow-[0_8px_20px_-8px_rgba(30,155,227,0.7)]"
                  : "text-[#9fb0d0] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
              }`}
            >
              <span>{n.label}</span>
              {n.badge && n.badge > 0 ? (
                <span
                  aria-label={`${n.badge} unread`}
                  className={`ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-none ${
                    isActive ? "bg-white text-rust-2" : "bg-rust text-white"
                  }`}
                >
                  {formatBadge(n.badge)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Cyan glow rising from the panel base; clipped by the rounded panel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(30,155,227,0.32),transparent)] blur-2xl"
      />
      <ContourArt
        className="absolute inset-x-0 bottom-0 h-44 text-white"
        opacity={0.12}
      />

      <div className="relative z-10 flex items-center gap-3 px-5 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)] text-xs font-semibold text-white">
          {initialsFor(userName)}
        </span>
        <div className="min-w-0 text-xs">
          <div className="truncate font-medium text-white">
            {userName ?? "Account"}
          </div>
          <div className="flex items-center gap-2 text-[#9fb0d0]">
            <span>{ROLE_LABELS[role]}</span>
            <span aria-hidden>·</span>
            {signOutSlot}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-paper p-3 lg:flex-row lg:gap-4 lg:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[232px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-paper-deep text-white shadow-[0_24px_60px_-24px_rgba(27,42,78,0.45)] lg:flex">
        {panel}
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[rgba(27,42,78,0.5)]"
          />
          <aside className="absolute inset-y-3 left-3 flex w-[264px] flex-col overflow-hidden rounded-[20px] bg-paper-deep text-white shadow-2xl">
            {panel}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
        <header className="sticky top-3 z-30 flex h-14 shrink-0 items-center gap-3 rounded-2xl border border-rule bg-paper-card px-4 lg:top-4 lg:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="text-ink-2 transition-colors hover:text-ink lg:hidden"
          >
            <MenuIcon />
          </button>
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/notifeyes-mark.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 object-contain"
            />
            <span className="text-sm font-semibold text-ink">
              Notif<span className="text-rust">Eyes</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2.5">
            {bell ? (
              <TopIconLink
                href={bell.href}
                label="Notifications"
                badge={bell.badge}
                active={activeHref === bell.href}
              >
                <BellIcon />
              </TopIconLink>
            ) : null}
            {mail ? (
              <TopIconLink
                href={mail.href}
                label="Messages"
                badge={mail.badge}
                active={activeHref === mail.href}
              >
                <MailIcon />
              </TopIconLink>
            ) : null}
            <Link
              href={profileHref}
              aria-label="Your profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rust-soft text-xs font-semibold text-rust-2 transition-colors hover:bg-[rgba(30,155,227,0.25)]"
            >
              {initialsFor(userName)}
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="max-w-6xl px-1 py-4 sm:px-3 lg:px-5 lg:py-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function TopIconLink({
  href,
  label,
  badge,
  active,
  children,
}: {
  href: string;
  label: string;
  badge?: number;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={badge && badge > 0 ? `${label}, ${badge} unread` : label}
      title={label}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        active
          ? "bg-rust-soft text-rust-2"
          : "text-ink-2 hover:bg-paper-2 hover:text-ink"
      }`}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-rust px-1 text-[9px] font-semibold leading-none text-white">
          {formatBadge(badge)}
        </span>
      ) : null}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 9a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
