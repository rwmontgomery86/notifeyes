import Link from "next/link";
import { signOut } from "@/lib/auth";

type Nav = { href: string; label: string };

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
      <aside className="border-r bg-card flex flex-col">
        <div className="px-5 py-5 border-b">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <span
              aria-hidden
              className="inline-block h-4 w-4 rounded-full border-2 border-foreground"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, hsl(var(--primary)) 0 30%, transparent 30%)",
              }}
            />
            NotifEyes
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {n.label}
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
