# Proposal Studio — Editor Design System

**Status:** Broadsheet reskin implemented; scope narrowed to the editor
**Updated:** 2026-08-27

This system styles the **proposal editor's** chrome. Document designs keep their
own typography, colors, geometry, and assets inside the canvas (`--design-*`
tokens, a completely separate namespace — see below).

## Scope: three design systems, one app

As of 2026-08-27 the app deliberately runs three visual systems, and the
boundaries between them are load-bearing:

| Surface | System | Tokens | Typeface |
| --- | --- | --- | --- |
| Rendered proposal pages | The document design | `--design-*` | Prata / Allura / Geist |
| Proposal editor (`/proposals/[id]/editor`) | Broadsheet (this doc) | `--editor-*` | Source Serif 4 |
| Admin area (`/proposals`, templates, itineraries, notifications) | Vendored admin kit | `--color-brand-*`, `--color-gray-*`, `--text-theme-*` | Outfit |

The admin area was moved off Broadsheet at the owner's explicit direction (see
`PROJECT_STATUS.md`, 2026-08-27), after being told that it would stop matching
the editor. It is not an accident and it is not a migration in progress: do not
"fix" one surface by making it look like another without a decision.

**The rule that keeps this survivable:** never restyle a shared component to
suit one surface. `EditorButton`, `EditorStatusBadge` and friends belong to the
editor; `components/admin/ui/*` belongs to the admin area. When the admin area
needs something the editor already has, copy it into `components/admin/ui/`
rather than adding a variant to the editor's kit — that is why
`AdminSegmentedControl` exists alongside `EditorSegmentedControl`.

## Broadsheet

The editor chrome's look — palette, typography, iconography, radius scale —
is sourced from **Broadsheet**, a design system imported from a Claude
Design mockup (`_ds/broadsheet-.../styles.css` + `readme.md` in that
project). Broadsheet's own identity: "newsprint set for the web" — near-black
serif on paper white, cyan and magenta process-ink accents used sparingly,
a tight 1–4px radius scale. Its stated rules that shaped this integration:
"do not introduce a sans-serif for UI chrome — the serif is the chrome" and
"use Phosphor icons in the duotone weight throughout." Its "do not structure
the page with rules, borders or boxes" rule was **not** carried over
literally — that's guidance for marketing/editorial pages, and Proposal
Studio is a dense multi-pane tool that genuinely needs panel/border
structure for usability. Broadsheet's token *values* were adopted; the
existing functional panel layout was kept.

`--editor-*` token **names** are unchanged from before this reskin — only
their values changed, sourced from Broadsheet's `--color-bg`/`-surface`/
`-text`/`-accent`/`-accent-2`/`-divider` and their 100–900 neutral/accent/
accent-2 tonal ramps (OKLCH-generated, same perceptual lightness per step
across roles). Status colors (`success`/`warning`/`danger`, 8 tokens) are
**intentionally excluded** — Broadsheet defines no semantic status palette,
and inventing one that merely resembles its ramp method would be
fabrication rather than extraction; they keep their pre-reskin hex values.

## Tokens

Tokens are declared in `app/globals.css` and exposed to Tailwind through
`@theme inline`.

### Surfaces

| Token | Use | Broadsheet source |
| --- | --- | --- |
| `editor-shell` | Application background outside panels and canvas | `--color-surface` |
| `editor-canvas` | Document workspace behind rendered pages | neutral-300 |
| `editor-panel` | Primary panel and proposal bar surface | `--color-bg` |
| `editor-panel-muted` | Page navigator and footer surface | neutral-200 |
| `editor-raised` | Inputs, cards, controls, and page thumbnails | literal `#ffffff` — Broadsheet's ramp never reaches pure white, but raised surfaces need to read lighter than the ramp's own 100 step |
| `editor-toolbar` | Workspace viewing toolbar | neutral-100 |
| `editor-inset` | Hover, selected support, and nested control surface | neutral-200 — tried `--color-accent-100` (a cyan tint) first, per Broadsheet's own rule to use ramp steps 100–300 for tinted fills/hovers, but reverted: this token is reused broadly for genuinely neutral surfaces too (status badge backgrounds, sequence-number circles, empty-state icon chips), not just hover/selected, and a cyan tint on those read as an unintended "this is active/tagged" signal. Kept achromatic, matching its pre-reskin character. |
| `editor-overlay` | Drawer modal backdrop | ink-tinted (`rgb(32 30 29 / 50%)`, derived from `--color-text`) |

### Text and brand

| Token | Use | Broadsheet source |
| --- | --- | --- |
| `editor-text-strong` | Primary headings and high-emphasis content | `--color-text` |
| `editor-text` | Default labels and values | neutral-800 |
| `editor-text-muted` | Metadata and descriptions | neutral-700 |
| `editor-text-subtle` | Help text, counters, and placeholders | neutral-600 — contrast against white measures ~4.3:1, at the edge of AA for normal text; acceptable for this token's non-essential use (placeholders/counters), worth revisiting if it's ever promoted to primary text |
| `editor-brand` | Primary editor action and selected mode | `--color-accent` (cyan) |
| `editor-brand-hover` | Primary action hover | `--color-accent-700` |
| `editor-accent` | Active-state indicator only (e.g. the selected page card's marker) | `--color-accent-2` (magenta) — a clean fit, since Broadsheet's second accent is meant to be used exactly this sparingly |

Document brand colors must never replace editor brand tokens. `editor-brand`
remains the only color used for primary actions (see `EditorButton` variants
below).

### Borders and focus

| Token | Use | Broadsheet source |
| --- | --- | --- |
| `editor-border-subtle` | Panel divisions and low-emphasis cards | `--color-divider` at ~8% |
| `editor-border` | Inputs and controls | `--color-divider` (Broadsheet's own value, ~16%) |
| `editor-border-strong` | Selection and focused input support | `--color-divider` at ~36% |
| `editor-focus` | Keyboard focus ring | `--color-accent` directly — matches Broadsheet's own `:focus-visible{outline:2px solid var(--color-accent)}` verbatim |

Focus uses a two-pixel ring plus offset and must remain visible on all editor
surfaces.

### Radius

Editor chrome uses its **own** radius scale, independent of the app's global
`--radius`/`--radius-sm..4xl` (which feeds every other `rounded-*` utility,
including the rendered document blocks — never touch that scale for editor
work): `--radius-editor-sm: 1px`, `--radius-editor-md: 2px`,
`--radius-editor-lg: 4px`, generating `rounded-editor-sm/md/lg` Tailwind
utilities. Roughly: `sm` for small nested controls, `md` for buttons/inputs/
icon chips, `lg` for cards/panels/notices. `rounded-full` (pills, avatars,
drag-handle chips) is untouched by this scale — Broadsheet's own `.tag`/
`.btn` treatments stay fully round too.

### Typography

`--font-editor`, an editor-chrome-only token distinct from `--font-heading`/
`--font-serif`/`--font-brand-heading` (those remain the rendered *document's*
typography hook, per `docs/BRAND_ASSET_PACK.md` — a hard namespace boundary,
never mixed with chrome typography). Resolves to Source Serif 4 (loaded via
`next/font/google` in `lib/fonts.ts`, mirroring the existing Geist Sans
setup) with a Geist Sans fallback. Applied via the `font-editor` Tailwind
class at exactly 3 root wrappers — `components/app/AppShell.tsx`,
`components/editor/ProposalEditorShell.tsx`, `app/login/page.tsx` — and
inherited by everything each one renders. Per Broadsheet's own rule ("the
serif is the chrome"), this covers all editor text, not headings only:
buttons, inputs, labels, panel headers.

### Icons

`@phosphor-icons/react`, in the **duotone** weight throughout (Broadsheet's
explicit rule), replacing the previous `lucide-react` icon set. Weight is
applied via `IconContext.Provider value={{ weight: "duotone" }}`, wrapped
once around the same two Client Component roots that can host a React
context provider — `AppShell.tsx` and `ProposalEditorShell.tsx` — so every
icon in a Client Component consuming either tree inherits duotone
automatically; no per-call-site `weight` prop needed.

Two files render icons directly in their own JSX while being Server
Components that can't host a context provider:
- `app/login/page.tsx` is an `async` Server Component (awaits
  `searchParams`) and can't become a Client Component. It imports from
  `@phosphor-icons/react/ssr` (a hook-free variant, safe in Server
  Components) and passes `weight="duotone"` explicitly per icon — a small,
  bounded set (4 icons).
- `components/editor/EditorUi.tsx` and `components/app/ApplicationRail.tsx`
  were converted to Client Components (`"use client"`) specifically so they
  could use the regular icon import and inherit duotone from context like
  everything else, rather than special-casing them with the `/ssr` path —
  they render icons directly in their own JSX and have no interactivity
  that would have been affected either way (React Server Components still
  server-render Client Components for the initial HTML; `"use client"` only
  affects hydration/bundling, not whether SSR happens).

`components/editor/sectionTypeIcons.tsx` stays a plain module (no directive
needed) — it only exports icon component *references* consumed by Client
Components downstream (`BlocksPalette.tsx`, `InsertionGap.tsx`,
`ProposalEditorShell.tsx`), never renders them itself.

Icon **names** changed where Phosphor and lucide don't share one — e.g.
`GripVertical` → `DotsSixVertical`, `LibraryBig` → `Books`, `Search` →
`MagnifyingGlass`, `Trash2` → `Trash`. Same-name icons (`Check`, `Compass`,
`FileText`, `Plus`, `Minus`, `Heart`, `Tag`, `Bell`, `X`, …) just changed
import source. `sectionTypeIcons.tsx`'s four block-type icons: `triangleDivider`
→ `ImageSquare`, `sectionDivider` → `Minus`, `thankYou` → `Heart`,
`signature` → `PenNib`.

### Status

Success, warning, and danger each have foreground, surface, and border
tokens (unchanged by the Broadsheet reskin — see above). Status is never
communicated by color alone; pair it with text and, where helpful, an icon.

### Elevation and motion

- `shadow-editor-page` (Broadsheet `--shadow-lg`), `shadow-editor-card`
  (`--shadow-md`), `shadow-editor-toolbar` (`--shadow-sm`) — ink-tinted
  recipes reused verbatim from Broadsheet rather than invented.
- Users requesting reduced motion receive immediate scrolling and effectively
  disabled non-essential editor transitions and animations.

### Dark mode — removed

Proposal Studio's editor chrome previously supported a dark theme (toggled
from the toolbar, persisted to `localStorage`, `.proposal-studio[data-theme
="dark"]` in `app/globals.css`). **This was removed as part of the
Broadsheet reskin**, not carried forward: Broadsheet's own identity is
explicitly light-only ("this system shows no dark surfaces" — its readme).
Inventing an off-spec dark palette that merely resembled Broadsheet's method
would be fabrication, and a disabled/hidden toggle with no working target
would be worse UX than no toggle at all. This is a real, deliberate feature
regression, not an oversight — noted here and in `docs/PROJECT_STATUS.md`'s
dated entry for anyone who remembers the old toggle.

This remains exclusively an editor-chrome concern either way:
`ProposalRenderer.tsx` and the proposal blocks read only `--design-*`
custom properties (per-design brand tokens), a completely separate
namespace from `--editor-*`.

### Deferred: spacing scale

Broadsheet's `--space-1..8` (5px–40px, "density 1.25×") is materially airier
than the editor chrome's current padding/gap rhythm (`p-4`, `gap-2`, `h-11`,
etc., unchanged Tailwind defaults). Re-tuning it touches real layout, not
just decoration, and needs its own visual-verification pass across every
panel/list/form — deliberately out of scope for this reskin. Token values
for a future pass, if undertaken: `--space-1: 5px` · `--space-2: 10px` ·
`--space-3: 15px` · `--space-4: 20px` · `--space-6: 30px` · `--space-8: 40px`.

## Components

Core components live in `components/editor/EditorUi.tsx` (now a Client
Component — see Icons above).

### `EditorButton`

| Variant | Use |
| --- | --- |
| `primary` | Save or the single dominant action in a region |
| `secondary` | Viewing controls, preview, navigation, supporting actions |
| `ghost` | Close and low-emphasis panel actions |

Sizes are `sm`, `md`, and `icon`. Icon-only instances require an accessible
name. Disabled buttons remain recognizable and non-interactive.

### `EditorPanelHeader`

Provides the shared panel height, divider, icon, uppercase label, optional
count, and optional 44×44 close action. Drawer instances place initial focus on
the close action.

### `EditorNotice`

| Tone | Use |
| --- | --- |
| `info` | Neutral availability or contextual explanation |
| `warning` | Unsaved or explicit-save guidance |
| `danger` | Save or validation failure |
| `success` | Confirmed safe behavior or readiness |

Notices may have a title. Error notices require an external `role="alert"` only
when they are introduced as a result of user submission; static notices should
not announce on initial render.

### `EditorField`

Standardizes label, required marker, input/textarea, help or error text, and
character count. It connects `aria-invalid` and `aria-describedby`
automatically. Server validation remains the source of truth.

### `EditorInspectorSection`

Provides a consistent section heading and label relationship for secondary
inspector groups.

### `EditorSegmentedControl`

Renders a labeled group of mutually exclusive view options. Selection uses
`aria-pressed`, a surface change, and inverse text. Every option remains a
native button and works with Tab plus Enter/Space. (Broadsheet's own `.seg`
demo markup uses native radio inputs — deliberately not adopted here; this
component's existing accessible button-group implementation already works
and wasn't worth an unrequested behavior change for raw-markup parity.)

### `EditorStatusBadge`

Supports neutral, warning, success, and danger tones with an optional icon.
Only the single global save badge uses a polite live region; duplicate visual
status badges remain silent.

### `EditorPageCard`

Owns page thumbnail framing, page number, title, description, eyebrow, selected
state, hover state, and `aria-current="page"`. The thumbnail remains supplied by
the active renderer so the component stays design-neutral. A genuine
Broadsheet `.card` usage — a discrete item, per that system's own definition
of what `.card` is for.

### `EditorDrawer`

Provides the modal frame, labeled dialog semantics, overlay dismissal, side,
panel width override, and shared elevation (maps to Broadsheet's
`.dialog-backdrop`/`.dialog`). Focus trapping, Escape handling, draft
protection, and focus restoration remain coordinated by the shell because
they depend on global editor state.

### `EditorEmptyState`

Provides regular and compact variants for unavailable content and filtered
lists. It uses an optional decorative icon, clear title, and recovery guidance.

### Palette card

A compact icon+label insertion card (`components/editor/BlocksPalette.tsx`):
a circular icon chip on `editor-inset` tinted `editor-brand`, a label, and a
primary "Add to proposal" action, with an optional `DotsSixVertical` drag
handle (`editorFocusRing`) in the top-left corner when dragging is enabled.
Denser than the hotel/excursion/library `article` cards (no photo or
description) because it represents a fixed structural block type, not a
data record — same distinction documented in
`docs/CONTEXTUAL_CATALOG.md`'s Blocks mode.
`components/editor/sectionTypeIcons.tsx` centralizes the icon-per-block-type
mapping shared by this card, the drag ghost, and `InsertionGap`'s menu, so
all three insertion surfaces read as one visual language.

### Drag ghost and drop indicator

The floating preview rendered while dragging a catalog/library/block item
(`components/editor/ProposalEditorShell.tsx`, portaled to `document.body`):
an icon chip (from the same `sectionTypeIcons` map, or `Buildings`/
`Compass`/`FileText` for hotels/excursions/saved sections) with a small
`Plus` badge at its corner, plus the item label. Its canvas-side counterpart
is `InsertionGap`'s highlighted state: a dashed `editor-brand` line spans the
gap and a small "Drop here" pill appears beside the "+" button. Both are
built entirely from `editor-*` tokens, same as every other editor-chrome
surface in this document — never `--design-*` document-brand tokens.

## Current coverage

- Proposal and workspace bars use semantic tokens.
- Pages and Properties panels use shared headers.
- Form controls, notices, errors, and save actions use shared components.
- Page cards, canvas, drawers, footer, and selection states use semantic tokens.
- `ProposalEditorShell.tsx` contains no hardcoded hex color values.
- View modes use `EditorSegmentedControl`.
- Proposal/save states use `EditorStatusBadge`.
- Search results use `EditorPageCard` and `EditorEmptyState`.
- Both responsive overlays use `EditorDrawer` while preserving their distinct
  visibility breakpoints.
- All editor chrome (toolbar, panels, dashboard, login) uses Broadsheet's
  color/typography/icon/radius system; the spacing scale is deferred (see
  above).

## Validation performed

`tsc`/`eslint` clean; visually verified in a real browser (login, dashboard,
editor toolbar, Properties panel, Catalog's Blocks tab); confirmed zero
console/page errors and the dark-mode toggle is gone; full e2e suite run for
regressions.
