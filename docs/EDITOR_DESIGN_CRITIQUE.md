# Proposal Studio — Phase 3.4 Design Critique

**Status:** Implementation review complete; rendered visual checkpoint pending  
**Updated:** 2026-08-21

## Overall impression

The editor now presents the correct product hierarchy: proposal-level context
and actions at the top, document location on the left, the rendered proposal in
the center, and contextual Content/Design controls on the right. The remaining
quality risk is visual rather than architectural because no integrated browser
instance was available for screenshot-based desktop/mobile review.

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

At 1440×900, 1024×768, 768×1024, and 390×844, verify:

1. Header controls do not crowd or truncate proposal identity excessively.
2. The canvas retains useful width with persistent side panels.
3. Content/Design controls remain readable and touch targets meet 44px.
4. Pages, Properties, and Review drawers do not overlap and restore focus.
5. Continuous scrolling keeps selection synchronized.
6. Contrast and zoom behavior remain acceptable at 200% browser zoom.

This checkpoint cannot be marked passed until a connected browser surface can
render and capture the editor at those sizes.
