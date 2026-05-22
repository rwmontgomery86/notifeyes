import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { OD_NAV } from "@/lib/nav";
import {
  getUnreadNotificationCount,
  getUnreadMessagesCount,
} from "@/lib/notifications/unread";

export default async function OdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = session.user.role;
  if (role !== "od" && role !== "admin") redirect("/p/dashboard");

  const [unreadNotifications, unreadMessages] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getUnreadMessagesCount(session.user.id),
  ]);

  const nav = OD_NAV.map((n) => ({
    href: n.href,
    label: n.label,
    badge:
      n.badgeKey === "notifications"
        ? unreadNotifications
        : n.badgeKey === "messages"
          ? unreadMessages
          : undefined,
  }));

  return (
    <AppShell role={role} userName={session.user.name} nav={nav}>
      {children}
    </AppShell>
  );
}
