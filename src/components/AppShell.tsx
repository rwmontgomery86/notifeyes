import { signOut } from "@/lib/auth";
import { NotificationsLive } from "@/components/NotificationsLive";
import { AppShellClient } from "@/components/AppShellClient";

type Nav = { href: string; label: string; badge?: number };

/**
 * Server half of the dashboard shell: owns the sign-out server action and the
 * live-notifications mount. All layout, nav, and interactivity live in
 * AppShellClient (the "floating panel" shell, chosen via /dev/shells).
 */
export function AppShell({
  role,
  userName,
  children,
  nav,
}: {
  role: "practice_owner" | "practice_scheduler" | "od" | "admin";
  userName?: string | null;
  children: React.ReactNode;
  nav: Nav[];
}) {
  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <>
      <NotificationsLive />
      <AppShellClient
        role={role}
        userName={userName}
        nav={nav}
        signOutSlot={
          <form action={doSignOut} className="inline">
            <button
              type="submit"
              className="font-medium text-[#9fb0d0] underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              Sign out
            </button>
          </form>
        }
      >
        {children}
      </AppShellClient>
    </>
  );
}
