# Phase 9 quality and deployment readiness

## Result

The technical roadmap is complete. The editor, responsive client proposal,
sharing, approval, PDF, persistence, backup, restore, and health flows are
covered by automated checks. Phase 9 remains open only because the repository
does not contain a complete owner-approved Melanated Safaris asset pack.

## Automated coverage

- Unit: itinerary codec, invalid input, pagination, sequential numbering,
  database assembly, design compatibility, catalog, and composition.
- Integration: editor, PDF, immutable share revision, password unlock, and
  revision approval.
- Playwright desktop/mobile: shell, continuous canvas, catalog, composition,
  Review, responsive properties, sharing/PDF controls, dialog focus, Escape,
  focus restoration, form labels, 44px buttons, and measured overflow.
- PDF: Chromium waits for fonts and images, measures semantic content bounds,
  records overflow pages, and emits page/overflow response headers.

## Accessibility audit

Standard: WCAG 2.1 AA, with 44px targets applied as an enhanced baseline.

| Area | Result | Evidence |
| --- | --- | --- |
| Keyboard | Pass | Dialogs trap Tab, close on Escape, and restore focus |
| Names/labels | Pass | No unlabeled input, select, or textarea in automated scan |
| Touch targets | Pass | Visible enabled editor buttons are at least 44×44px |
| Focus visibility | Pass | `#a67512` focus ring is 3.91:1 on panel background |
| Text contrast | Pass | Text 10.14:1; muted 4.99:1; subtle 4.63:1 |
| Responsive | Pass | Desktop Chrome and Chromium mobile emulation |

Manual NVDA/VoiceOver testing is still recommended before public launch.

## Pagination

Heuristics decide initial splits, then the editor and PDF pipeline measure
rendered text, list, heading, and table bounds. Review surfaces affected page
numbers. The seed document needed an excursion-budget correction and now
renders 34 pages with no measured semantic overflow.

## Catalog completeness

The seed catalog includes Mainland Tanzania and Zanzibar, Arusha and Karatu,
Under the Shade Safari Lodge, Ngorongoro Farm House, and the proposal excursion
catalog. The missing Karatu/hotel requirement is complete.

## Deployment and recovery

The selected topology is one Node/Docker instance with persistent SQLite.
WAL, startup migrations, health checks, JSON logs, online backup, integrity
verification, and guarded restore are implemented. See `OPERATIONS.md`.

## Remaining brand gate

Reference-page PNGs are visual direction, not proof of rights or approval for
extracted assets. The required handoff is the approved logo, licensed fonts,
founder and travel photography, icons/illustrations, and usage rights.

**Partially closed on 2026-08-27, with the owner's explicit approval on each
call — the criterion stays open.** Two slots now carry real assets: the
typography (Prata for the display role, Allura for the script role, both OFL
licensed, so they ship as-is) and the logo, extracted from
`reference/pdf-pages/page-01.png` because that is the only copy of the mark in
the repo. The extracted logo is an interim asset, approved as such: it is
169x64 px, which is sharp at the sizes the document uses it but has no
headroom above them, and it is not a substitute for the vector original. Still
outstanding, and still blocking: the vector/high-resolution logo, founder and
travel photography (Picsum URLs remain), and commissioned section icons (the
globe and warning slots still render generic stand-ins). The final brand
acceptance criterion must not be marked complete until those arrive.

The import path for that handoff is now mechanical: the logo wordmark and the
two fixed section icons (globe, warning triangle) are config-driven through
`lib/brand/config.ts`, and heading typography resolves through a single CSS
variable chain in `app/globals.css` (`--font-serif` → `--font-heading` →
`--font-brand-heading`) rather than being hardcoded per block. Content
photography (hotel, excursion, itinerary, cover, team photos) stays a data
edit in `lib/db/seed.ts`, not a config slot, because each photo is
independent per-record content. See `docs/BRAND_ASSET_PACK.md` for the exact
file paths and activation steps.
