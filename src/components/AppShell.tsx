import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import { NotificationsLive } from "@/components/NotificationsLive";

type Nav = { href: string; label: string; badge?: number };

function formatBadge(n: number): string {
  return n > 99 ? "99+" : String(n);
}

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
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <NotificationsLive />
      <aside className="border-r bg-card flex flex-col">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <Image
              src="/notifeyes-mark.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain shrink-0"
            />
            <span>Notif<span className="text-primary">Eyes</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <span>{n.label}</span>
              {n.badge && n.badge > 0 ? (
                <span
                  aria-label={`${n.badge} unread`}
                  className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground"
                >
                  {formatBadge(n.badge)}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4 space-y-3 text-xs text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">{userName ?? "Account"}</div>
            <div className="capitalize">{role.replace("_", " ")}</div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="ne-btn-ghost w-full justify-start px-2">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="px-8 py-8 max-w-6xl">{children}</main>
    </div>
  );
}
