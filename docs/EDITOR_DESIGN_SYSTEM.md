# Proposal Studio — Editor Design System

**Status:** Phase 3.2 implemented  
**Updated:** 2026-08-21

This system styles Proposal Studio chrome only. Document designs keep their own
typography, colors, geometry, and assets inside the canvas.

## Tokens

Tokens are declared in `app/globals.css` and exposed to Tailwind through
`@theme inline`.

### Surfaces

| Token | Use |
| --- | --- |
| `editor-shell` | Application background outside panels and canvas |
| `editor-canvas` | Document workspace behind rendered pages |
| `editor-panel` | Primary panel and proposal bar surface |
| `editor-panel-muted` | Page navigator and footer surface |
| `editor-raised` | Inputs, cards, controls, and page thumbnails |
| `editor-toolbar` | Workspace viewing toolbar |
| `editor-inset` | Hover, selected support, and nested control surface |
| `editor-overlay` | Drawer modal backdrop |

### Text and brand

| Token | Use |
| --- | --- |
| `editor-text-strong` | Primary headings and high-emphasis content |
| `editor-text` | Default labels and values |
| `editor-text-muted` | Metadata and descriptions |
| `editor-text-subtle` | Help text, counters, and placeholders |
| `editor-brand` | Primary editor action and selected mode |
| `editor-brand-hover` | Primary action hover |
| `editor-accent` | Active-state indicator only (e.g. the selected page card's marker) |

Document brand colors must never replace editor brand tokens. The accent
is deliberately scoped to a single job — marking the current selection —
not a general-purpose decorative color; `editor-brand` remains the only
color used for primary actions (see `EditorButton` variants above).

### Borders and focus

| Token | Use |
| --- | --- |
| `editor-border-subtle` | Panel divisions and low-emphasis cards |
| `editor-border` | Inputs and controls |
| `editor-border-strong` | Selection and focused input support |
| `editor-focus` | Keyboard focus ring |

Focus uses a two-pixel ring plus offset and must remain visible on all editor
surfaces.

### Status

Success, warning, and danger each have foreground, surface, and border tokens.
Status is never communicated by color alone; pair it with text and, where
helpful, an icon.

### Elevation and motion

- `shadow-editor-page` separates rendered paper from the canvas.
- `shadow-editor-card` identifies the selected page card.
- `shadow-editor-toolbar` separates global navigation from work surfaces.
- Users requesting reduced motion receive immediate scrolling and effectively
  disabled non-essential editor transitions and animations.

## Components

Core components live in `components/editor/EditorUi.tsx`.

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
native button and works with Tab plus Enter/Space.

### `EditorStatusBadge`

Supports neutral, warning, success, and danger tones with an optional icon.
Only the single global save badge uses a polite live region; duplicate visual
status badges remain silent.

### `EditorPageCard`

Owns page thumbnail framing, page number, title, description, eyebrow, selected
state, hover state, and `aria-current="page"`. The thumbnail remains supplied by
the active renderer so the component stays design-neutral.

### `EditorDrawer`

Provides the modal frame, labeled dialog semantics, overlay dismissal, side,
panel width override, and shared elevation. Focus trapping, Escape handling,
draft protection, and focus restoration remain coordinated by the shell because
they depend on global editor state.

### `EditorEmptyState`

Provides regular and compact variants for unavailable content and filtered
lists. It uses an optional decorative icon, clear title, and recovery guidance.

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

## Validation still required

A rendered desktop/mobile visual comparison remains required when a browser
surface is available. It is tracked as Phase 3.4 validation rather than a
design-system extraction task.
