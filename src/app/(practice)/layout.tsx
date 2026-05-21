import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const NAV = [
  { href: "/p/dashboard", label: "Dashboard" },
  { href: "/p/shifts/new", label: "Post a shift" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/p/billing", label: "Billing" },
  { href: "/p/settings", label: "Practice settings" },
];

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "practice_owner" && role !== "practice_scheduler" && role !== "admin") {
    redirect("/d/shifts");
  }
  return (
    <AppShell role={role} userName={session.user.name} nav={NAV}>
      {children}
    </AppShell>
  );
}
