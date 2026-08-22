# Proposal Studio — Phase 3.4 Design Critique

**Status:** Implementation review complete; rendered visual checkpoint done, no open regressions  
**Updated:** 2026-08-22

## Overall impression

The editor now presents the correct product hierarchy: proposal-level context
and actions at the top, document location on the left, the rendered proposal in
the center, and contextual Content/Design controls on the right. A live render
at 1440×900, 1024×768, 768×1024, and 390×844 (`/proposals/1/editor`, Chromium)
confirms the architecture holds at every size. One real regression was found at
the smallest breakpoint — see "Remaining visual checkpoint" below.

## Usability

| Finding | Severity | Resolution |
| --- | --- | --- |
| Content and presentation were mixed in one long inspector | High | Added explicit Content and Design modes while keeping drafts mounted when switching modes |
| Technical page metadata competed with primary editing | Moderate | Moved Page information into a collapsed native disclosure |
| Review existed only in the roadmap | Moderate | Added a proposal-level Review drawer with saved-state, page, compatibility, design, and format checks |
| Design switching was unavailable on the smallest header | High on mobile | Added the same proposal-scoped selector inside the responsive Design inspector |
| Design variants had no contextual surface | Moderate | Design mode now displays only variants registered for the selected section type |

## Visual hierarchy

- Proposal identity remains the first heading.
- The active design is visible in the proposal bar and editable from the Design
  inspector.
- Page title and viewing controls remain attached to the canvas.
- Content fields occupy the primary inspector mode; design information and
  technical metadata are progressively disclosed.
- Review is a secondary proposal action beside Client preview rather than a
  competing primary action.

## Consistency

- New controls reuse `EditorSegmentedControl`, `EditorStatusBadge`,
  `EditorNotice`, `EditorEmptyState`, `EditorInspectorSection`, and
  `EditorDrawer`.
- No document brand token recolors the editor chrome.
- Review uses the same warning, danger, success, focus, border, and surface
  semantics as editing.

## Accessibility checkpoint

- Inspector modes are native buttons with `aria-pressed` through the shared
  segmented control.
- Page information uses keyboard-operable native `details`/`summary`.
- Review is a labeled modal drawer with focus trap, Escape dismissal, overlay
  dismissal, initial focus, and focus restoration.
- Design selectors are native controls and incompatible options are disabled.
- Save and design failures retain one global live announcement; duplicated
  supporting text remains silent.

## What works well

- Server-rendered document pages stay outside the client design registry and
  remain central to the experience.
- The same shell and inspector render both registered design descriptors with
  no template-specific UI branch.
- Design switching and Review never mutate or discard proposal content.

## Remaining visual checkpoint

At 1440×900, 1024×768, 768×1024, and 390×844:

1. **Header controls do not crowd or truncate proposal identity excessively —
   FIXED.** Below `sm` (640px) the design selector used to collapse from a
   `<select>` into an `EditorStatusBadge` that stayed inline with the proposal
   identity block in the same `justify-between` row as four icon buttons
   (Review, Client preview, Share, Generate PDF). With `min-w-0`/`truncate` on
   the identity block losing the width contest, `The Mainland Tour` rendered
   as `T…` and `DEMO-0001 · Prospective Traveler` rendered as `DE…` — the
   identity was effectively unreadable at this width. The mobile-only badge
   was redundant (the document design name and a full switcher already appear
   in the Properties drawer's Design mode and in the Review drawer's "Current
   document" card), so it was removed from the header row rather than
   resized. Identity now truncates gracefully (`The Mainlan…` /
   `DEMO-0001 · Pr…`) at 390px, and 768px+ is unaffected since the badge was
   already hidden there.
2. **The canvas retains useful width with persistent side panels — PASS.** At
   1024px the Pages panel stays docked and Properties correctly demotes to a
   drawer behind the sliders icon; at 768px and 390px both Pages and
   Properties are icon-triggered drawers and the canvas keeps full width.
3. **Content/Design controls remain readable and touch targets meet 44px —
   PASS.** Confirmed by the automated `tests/e2e/editor.spec.ts` accessibility
   baseline test (button hit-target and label assertions) on both the desktop
   and mobile Playwright projects.
4. **Pages, Properties, and Review drawers do not overlap and restore focus —
   PASS.** Verified visually at 390px: Properties and Review render as clean,
   non-overlapping right-side sheets with proper heading, close button, and
   status summary card; `editor.spec.ts` covers focus-to-close-button and
   focus-restoration-on-Escape for the catalog drawer.
5. **Continuous scrolling keeps selection synchronized — not re-verified this
   pass.** No regression suspected; not exercised beyond the existing
   automated coverage.
6. **Contrast and zoom behavior remain acceptable at 200% browser zoom — still
   unverified.** No automated contrast check exists and 200% zoom was not
   captured in this pass.

Separately, `tests/e2e/editor.spec.ts`'s first test (catalog/structure/review
dialog assertions) flaked when the `desktop` and `mobile` Playwright projects
ran concurrently against the same dev server and proposal row, but passed
reliably in isolation (`--workers=1`) — this looks like shared-state test
flakiness, not an editor defect, and is unrelated to the findings above.
