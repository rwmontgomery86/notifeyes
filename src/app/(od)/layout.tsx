import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const NAV = [
  { href: "/d/shifts", label: "Browse shifts" },
  { href: "/d/watch", label: "Watch zones" },
  { href: "/notifications", label: "Notifications" },
  { href: "/messages", label: "Messages" },
  { href: "/d/payouts", label: "Payouts" },
  { href: "/d/profile", label: "My profile" },
];

export default async function OdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "od" && role !== "admin") redirect("/p/dashboard");
  return (
    <AppShell role={role} userName={session.user.name} nav={NAV}>
      {children}
    </AppShell>
  );
}
