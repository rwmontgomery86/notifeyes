# NotifEyes design system

## Tokens (src/app/globals.css, mapped in tailwind.config.ts)

Surfaces:
- `--paper` #f4f6fa — app background (light gray-blue)
- `--paper-2` #e7ecf3 — recessed surfaces, hovers
- `--paper-card` #ffffff — cards
- `--paper-deep` #1b2a4e — deep navy (same value as `--ink`); the contrast surface

Ink (text):
- `--ink` #1b2a4e — primary text (navy)
- `--ink-2` #4a5876 — secondary
- `--ink-3` #8b9aaf — tertiary
- `--ink-faint` #b8c3d3 — disabled

Brand:
- `--rust` #1e9be3 — primary accent (cyan; the token name is historical)
- `--rust-2` #1577b3 — accent hover
- `--rust-soft` #dceefa — accent tint background
- `--sage` #3faf4f / `--sage-soft` #dcf2df — success
- `--gold` #f0b03c — warning/attention

Rules: `--rule` #dce2eb, `--rule-strong` #b8c3d3. Radius: `--radius` 6px (`rounded-card`).

Utility classes: `ne-card`, `ne-btn` (cyan solid), `ne-btn-secondary`, `ne-btn-ghost`, `ne-input`, `ne-label`, `ne-pill`.

Fonts: Geist (`--font-display`, headings via `.font-display`, letter-spacing -0.012em) + Inter (`--font-sans`, everything else). Loaded in `src/app/layout.tsx` via next/font.

## Gotchas

- Tailwind colors are raw `var(--x)` strings, so **opacity modifiers (`bg-rust/15`) silently do nothing**. Use rgba arbitrary values (`bg-[rgba(30,155,227,0.16)]`) or plain CSS.
- `src/env.ts` is server-only; client components must not import it.
- No animation library; motion is CSS transitions only.

## Marketing site direction (2026-07-05)

Set by the For Optometrists redesign (`src/app/for-optometrists/page.tsx` is
the reference implementation); adopt on other marketing pages as they're
touched. The app dashboard is unaffected.

- Display headings: **bold (700)**, tracking -0.02em — heavier than the app's
  font-medium standard.
- Shared kit: `PhoneFrame` (realistic device shell, `dark` prop for dark
  screens), `MarketingButton` size `xl`, Caveat script font (`--font-script`,
  `font-script` utility) for handwritten annotations.
- Mockup/render blues always map onto the existing `--rust` scale — no new
  brand hexes. Greens map to `--sage`.
- No fabricated social proof (user counts, ratings, testimonials): use
  true-facts cards and bracketed `[placeholder]` styling until real data exists.

## Dashboard shell direction (2026-06-11)

Decided via interview; candidate shells live at `/dev/shells` (dev/preview only — the route 404s in production).

- Deep navy sidebar (`--paper-deep`) against light paper content. Light theme; the product is used in daylight clinical settings.
- Cyan (`--rust`) reserved for primary actions and the active/selected state.
- Sidebar decoration: faded topographic contour-line artwork (the watch-zone motif), bottom-anchored, masked to fade upward. Intensity is a per-variant dial (0.04 to 0.12 opacity).
- Motion: CSS-only, 150-250ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint family). Motion conveys state change only.
- Anchors: the friendly rounded warmth of modern edu-SaaS dashboards crossed with Linear's restraint. Product register: familiarity over novelty.

**CHOSEN (2026-06-11): Floating panel** — applied to the real shell
(`src/components/AppShell.tsx` + `AppShellClient.tsx`). The other two
candidates remain viewable at `/dev/shells` for reference.

The shipped shell:
- Sidebar floats as a 20px-radius navy panel inset from the viewport edge
  (soft shadow, cyan glow + contour art at the base). Active nav item is a
  solid cyan pill (`usePathname` longest-prefix matching; the old shell had
  no active state at all).
- **Top bar card** holds bell (`/notifications`) and mail (`/messages`)
  icons with live unread badges plus the avatar (links to profile/settings
  by role). Those two entries no longer render in the sidebar nav; the
  split happens inside AppShell by exact href, so `src/lib/nav.ts` and the
  layouts are unchanged. No search until a search feature exists.
- **Mobile (< lg)**: the panel hides; the top bar gains a hamburger + logo;
  the panel slides in as an overlay drawer (closes on nav, backdrop, Esc).
- `.leaflet-container { isolation: isolate; z-index: 0 }` in globals.css
  (outside @layer — Tailwind v3 drops unused-looking selectors inside
  @layer) traps Leaflet's z-indexes so maps can't paint over the sticky
  top bar or the drawer.
