import { OD_NAV } from "@/lib/nav";

export type ShellVariantProps = {
  /** Index of the active nav item. */
  active: number;
  onNavClick: (index: number) => void;
  /**
   * False inside the scaled grid previews: nav buttons get tabIndex -1 so the
   * aria-hidden preview tree stays out of the tab order (React 18 has no
   * `inert` attribute).
   */
  interactive: boolean;
};

// Real OD nav labels with representative unread counts, so the variants are
// judged with true content. Buttons only — the gallery never navigates.
const MOCK_BADGES: Record<string, number> = { notifications: 3, messages: 1 };

export const NAV_ITEMS = OD_NAV.map((n) => ({
  label: n.label,
  badge: n.badgeKey ? MOCK_BADGES[n.badgeKey] : undefined,
}));
