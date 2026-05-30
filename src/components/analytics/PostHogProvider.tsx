"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// Read the public env directly (NEXT_PUBLIC_* is inlined at build time).
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Dormant unless BOTH are set, and only active in production so dev/test
// sessions never pollute the prod project. Absent env → a transparent
// pass-through wrapper with zero PostHog code on the page.
const ENABLED =
  Boolean(POSTHOG_KEY && POSTHOG_HOST) &&
  process.env.NODE_ENV === "production";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!ENABLED) return;
    posthog.init(POSTHOG_KEY as string, {
      api_host: POSTHOG_HOST,
      // We send pageviews manually (App Router client navigations don't fire
      // a fresh page load), so disable the automatic one to avoid double-count.
      capture_pageview: false,
      capture_pageleave: true,
      // Only create person profiles for identified users — keeps anonymous
      // event volume (and cost) down at beta scale.
      person_profiles: "identified_only",
    });
  }, []);

  if (!ENABLED) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      {/* useSearchParams must sit under a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  );
}

// Fires a $pageview on every client-side route/query change.
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
