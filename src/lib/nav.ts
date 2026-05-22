export type NavItem = {
  href: string;
  label: string;
  badgeKey?: "notifications" | "messages";
};

export const OD_NAV: NavItem[] = [
  { href: "/d/shifts", label: "Browse shifts" },
  { href: "/d/watch", label: "Watch zones" },
  { href: "/notifications", label: "Notifications", badgeKey: "notifications" },
  { href: "/messages", label: "Messages", badgeKey: "messages" },
  { href: "/d/payouts", label: "Payouts" },
  { href: "/d/profile", label: "My profile" },
];

export const PRACTICE_NAV: NavItem[] = [
  { href: "/p/dashboard", label: "Dashboard" },
  { href: "/p/shifts/new", label: "Post a shift" },
  { href: "/messages", label: "Messages", badgeKey: "messages" },
  { href: "/notifications", label: "Notifications", badgeKey: "notifications" },
  { href: "/p/billing", label: "Billing" },
  { href: "/p/settings", label: "Practice settings" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/verifications", label: "OD verifications" },
  { href: "/admin/payouts", label: "Manual payouts" },
  { href: "/admin/geocode", label: "Geocode backfill" },
  { href: "/admin/notifications", label: "Dev notifications log" },
];

export type Role =
  | "practice_owner"
  | "practice_scheduler"
  | "od"
  | "admin";

export function navForRole(role: Role): NavItem[] {
  if (role === "od") return OD_NAV;
  if (role === "admin") return ADMIN_NAV;
  return PRACTICE_NAV;
}
