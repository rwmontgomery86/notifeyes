import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

const NAV = [
  { href: "/admin/verifications", label: "OD verifications" },
  { href: "/admin/payouts", label: "Manual payouts" },
  { href: "/admin/geocode", label: "Geocode backfill" },
  { href: "/admin/notifications", label: "Dev notifications log" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");
  return (
    <AppShell role={session.user.role!} userName={session.user.name} nav={NAV}>
      {children}
    </AppShell>
  );
}
