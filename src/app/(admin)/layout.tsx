import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ADMIN_NAV } from "@/lib/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");
  return (
    <AppShell role={session.user.role!} userName={session.user.name} nav={ADMIN_NAV}>
      {children}
    </AppShell>
  );
}
