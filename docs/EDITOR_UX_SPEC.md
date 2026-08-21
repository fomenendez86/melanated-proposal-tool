# Proposal Studio — Editor UX Specification

**Status:** Phase 3.1 approved baseline  
**Updated:** 2026-08-21  
**Scope:** Reusable editor shell for multiple proposal document designs

## 1. North star

The editor should answer four questions immediately:

1. Which proposal am I editing?
2. Which document design is active?
3. Which page or section am I changing?
4. Are my changes saved and ready to preview?

The document remains the visual center. Pages provide location, Properties
provides the current action, and the top bar provides proposal-level actions.
Document branding belongs inside the canvas; editor chrome stays consistent
across designs.

## 2. Primary workflows

### Create or resume a proposal

1. Open a draft.
2. Confirm proposal identity, client, status, and active design.
3. Resume at the last selected section or first incomplete section.

### Edit content

1. Select a page from the document or Pages panel.
2. Edit the contextual Content inspector.
3. See dirty/saving/error state near the action and globally.
4. Refresh the saved document preview without losing location.

### Change presentation

1. Open the Design inspector for the selected section.
2. Choose only variants supported by the active document design.
3. Preview repagination before accepting an incompatible change.

### Change document design

1. Open the active design control in the proposal header.
2. Compare available designs with thumbnail, name, version, and compatibility.
3. Review unsupported sections or variants.
4. Confirm the switch or return without modifying the proposal.

### Review and generate

1. Open Review to see missing, invalid, or incompatible content.
2. Navigate directly from an issue to its page and field.
3. Open client preview.
4. Generate only from saved, valid proposal data.

## 3. Information architecture

```text
Proposal Studio
├── Proposal bar
│   ├── Back / proposal identity / client / status
│   ├── Active document design
│   ├── Save state
│   └── Review / Preview / Generate
├── Pages panel
│   ├── Search
│   ├── Page and section navigator
│   ├── Page status
│   └── Add section entry point
├── Document workspace
│   ├── Page navigation
│   ├── View mode
│   ├── Zoom / fit
│   └── Rendered document canvas
└── Inspector
    ├── Content
    ├── Design
    └── Page information
```

### Ownership rule

| Surface | Owns | Must not own |
| --- | --- | --- |
| Proposal bar | Proposal identity, active design, global save/review/output | Page-specific fields |
| Pages panel | Document location, order, status, section insertion | Catalog administration |
| Workspace | Faithful output, selection, zoom, view mode | Permanent form controls |
| Inspector | Selected content and allowed presentation variants | Global navigation |

## 4. Layout behavior

### Wide desktop — 1280px and above

- Persistent 260px Pages panel.
- Flexible canvas with a minimum usable width of 520px.
- Persistent 336px Inspector.
- Proposal bar and workspace toolbar remain separate: global actions above,
  viewing controls directly above the canvas.

### Compact desktop/tablet — 768px to 1279px

- Pages remains persistent when at least 1024px is available.
- Inspector opens as a right drawer.
- Below 1024px, both side panels become drawers.
- Canvas always receives the remaining width; no horizontal page overflow at
  Fit width.

### Mobile — below 768px

- Compact proposal bar shows title, save state, and one primary output action.
- Pages and Inspector open as full-height drawers with clear labels.
- Workspace toolbar prioritizes Pages, previous/next, fit, and Properties.
- View-mode labels may collapse to icons, but accessible names remain complete.
- Drawers preserve drafts and require confirmation before destructive closure.

## 5. Visual hierarchy

### Level 1 — proposal context

- Proposal title is the primary heading.
- Client and proposal number are supporting metadata.
- Active design is a visible labeled control, not hidden in settings.
- Generate is the eventual primary global action; Preview is secondary.

### Level 2 — selected document location

- Selected page title and page count appear in the workspace toolbar.
- The selected thumbnail uses border and surface change, not color alone.
- Repeated page types include differentiating descriptions.

### Level 3 — contextual edit action

- Inspector starts with the selected section title.
- Content and Design are explicit inspector modes.
- Field labels carry more emphasis than help text and counters.
- Explicit-save collections keep their action sticky at the inspector bottom
  when the form is longer than the viewport.

## 6. Interaction states

| State | Global indication | Local indication | Allowed actions |
| --- | --- | --- | --- |
| Loaded | Neutral “Up to date” | Fields show saved values | All navigation |
| Dirty | Amber “Unsaved changes” | Save action enabled | Preview saved version; warn on leaving |
| Saving | Spinner and “Saving” | Inputs remain readable; duplicate submit blocked | Safe navigation waits or warns |
| Saved | Green confirmation, then neutral | Save action confirms completion | All navigation |
| Invalid | Red issue count | Field error and summary with focus target | Navigation allowed with warning |
| Save failed | Persistent red status | Retry action and retained draft | No silent discard |
| Incompatible | Review badge | Exact unsupported section/variant reason | Cancel or resolve before switch |
| Read-only | Lock status | Explanation and no editable affordance | Preview/navigation only |
| Loading | Stable skeleton geometry | No layout jump | Cancel/back where safe |
| Empty | Clear next action | Context-specific guidance | Add/select content |

## 7. Inspector model

### Content mode

- Shows proposal data used by the selected section.
- Short scalar fields may autosave.
- Collections, financial data, design switches, and graph replacements require
  explicit save.
- Raw text collection formats are an interim control. They must eventually be
  replaced by repeatable field groups without changing server contracts.

### Design mode

- Shows only variants registered by the active document design.
- Includes layout variant, image treatment, approved emphasis, and visibility
  controls where supported.
- Never exposes arbitrary coordinates, dimensions, or freeform CSS.

### Page information

- Secondary, collapsed by default.
- Contains page number, block type, source, render status, and design variant.
- Technical identifiers use copyable monospace text only when useful for
  support; they do not compete with editing fields.

## 8. Page navigator model

- Default grouping is by document section while preserving printed page order.
- Paginated output from one source section remains visibly related.
- Search matches page number, section label, title, description, and status.
- Each page card supports selected, hover, warning, error, hidden, and dragging
  states.
- “Add section” belongs at the end of the section list and opens contextual
  block choices supported by the active design.
- Reordering moves source sections, not individual generated pagination chunks.

## 9. Multi-design behavior

- The active design control shows name and version in the proposal bar.
- Design selection is proposal-scoped and never presented as administration.
- A design card includes thumbnail, supported page size, section coverage, and
  compatibility result.
- Compatible content is preserved during a switch.
- Unsupported content is listed before confirmation and never silently deleted.
- A failed switch leaves the saved design and document unchanged.
- Editor colors remain neutral; design brand colors do not recolor the shell.

## 10. Accessibility requirements

- All interactive targets are at least 44×44 CSS pixels on touch surfaces.
- Keyboard order follows Proposal bar → Pages → Workspace → Inspector.
- Drawers trap focus, close with Escape, and restore focus to their trigger.
- Selected pages use `aria-current="page"`; mode controls use `aria-pressed` or
  tabs with correct semantics.
- Save and validation updates use non-duplicated polite live regions.
- Error summaries link to fields and move focus only after explicit submission.
- Text and essential icons meet WCAG 2.1 AA contrast.
- Reduced-motion preferences disable smooth page scrolling and non-essential
  transitions.

## 11. Current design critique

This audit is based on the implemented shell structure. A new rendered visual
review is pending because no browser surface was available during this pass.

### Overall impression

The existing three-pane editor establishes the correct mental model and keeps
the document central. Its biggest gap is product hierarchy: it behaves as a
useful page inspector, but the active design, review workflow, and distinction
between content and presentation are not yet visible.

### Findings

| Finding | Severity | Recommendation |
| --- | --- | --- |
| Active document design is not visible | Critical | Add a labeled design control to the proposal bar before supporting a second design |
| Inspector is one long undifferentiated stream | High | Separate Content, Design, and collapsed Page information |
| Collection fields expose parser syntax | High | Keep as functional fallback, then migrate to repeatable structured groups |
| Save status appears in header and footer while local forms also carry state | Moderate | Define one global live region plus contextual action state |
| Technical page information receives persistent vertical space | Moderate | Collapse it below primary editing controls |
| Proposal output flow has Preview but no visible Review stage | Moderate | Introduce Review before Generate becomes active |
| Editor styling contains 136 hex usages and 83 unique six-digit colors | High | Replace hardcoded shell colors with semantic editor tokens |
| Page dimensions are shell constants | High for multi-design | Supply page geometry from the active design definition |
| Empty/read-only copy refers to future implementation | Minor | Use user-facing availability and recovery language |

### What works

- The document is visually and structurally the main surface.
- Page thumbnails, search, continuous scroll, single-page mode, and synchronized
  selection create a strong navigation foundation.
- Side panels already convert to focus-managed drawers on smaller screens.
- Touch targets, visible focus, save protection, and explicit collection saves
  provide a solid accessibility and data-safety base.

## 12. Editor design-system baseline

### Semantic token groups

| Group | Required tokens |
| --- | --- |
| Surfaces | `canvas`, `panel`, `raised`, `sunken`, `overlay` |
| Text | `strong`, `default`, `muted`, `inverse`, `danger`, `warning`, `success` |
| Borders | `subtle`, `default`, `strong`, `focus`, `danger` |
| Actions | `primary`, `primary-hover`, `secondary-hover`, `disabled` |
| Status | `info`, `warning`, `danger`, `success` surfaces and foregrounds |
| Elevation | `page`, `popover`, `drawer` |
| Motion | `fast`, `normal`, `slow`, standard easing |

### Reusable shell components

- `EditorIconButton`
- `EditorButton`
- `EditorSegmentedControl`
- `EditorStatusBadge`
- `EditorPanelHeader`
- `EditorPageCard`
- `EditorField`
- `EditorNotice`
- `EditorDrawer`
- `EditorInspectorSection`
- `EditorEmptyState`

Every component documents default, hover, active, focus, disabled, loading, and
error states where applicable.

## 13. Implementation order

1. Define semantic editor tokens and remove color duplication from the shell.
2. Extract common buttons, panel headers, notices, and field styles.
3. Rebuild the proposal bar hierarchy and add the active-design placeholder.
4. Introduce Content/Design inspector modes and collapse Page information.
5. Add Review entry point and consistent validation/status badges.
6. Introduce the versioned design definition and move page geometry out of the
   shell.
7. Validate with the current design plus a second minimal design fixture.
8. Run rendered desktop/mobile critique, accessibility checks, and visual
   regression tests before closing Phase 3.

## 14. Phase 3.1 acceptance

- Primary editor workflows and surface ownership are documented.
- Desktop, tablet, and mobile behavior is defined.
- Save, validation, compatibility, loading, and empty states are defined.
- Multi-design selection and safe switching behavior are specified.
- Accessibility requirements are explicit.
- The current shell has a prioritized critique tied to implementation actions.
