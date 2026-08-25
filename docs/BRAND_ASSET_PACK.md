# Brand asset pack — import pipeline

**Status:** pipeline ready; no owner-approved assets received yet. This is the
last open criterion of Phase 9 — see `PHASE9_QUALITY_DEPLOYMENT.md`.

## What still needs to arrive

The approved logo, licensed fonts, founder and travel photography, and any
commissioned icons/illustrations, with usage rights confirmed. Until then,
text/emoji stand-ins and stock placeholder photos remain in place on purpose.

## What "mechanical" means here

Two categories of placeholder exist, and they are handled differently:

- **Brand slots** (logo, section icons, fonts): a single value in code, used
  everywhere it appears. Swapping these is a one-line config change plus
  dropping a file — no component edits.
- **Content photography**: individual photos on individual catalog/seed
  records (one per hotel, excursion, itinerary day, etc.). There is no single
  slot to flip; each URL is data, not brand config. Swapping these is a data
  edit, described below.

## Brand slots (config-driven)

### Logo wordmark

- Source of truth: `lib/brand/config.ts` → `BRAND_LOGO`.
- Consumed by `components/blocks/shared/BrandWordmark.tsx`, used at every
  place the document currently prints the "Melanated Safaris" text wordmark
  (`PageHeader`, `CoverBlock`, `CityToursDividerBlock`, `ExcursionListBlock`,
  `SectionDividerBlock`).
- To activate: drop the logo file at `public/brand/logo/wordmark.svg` (or
  `.png`), then change `BRAND_LOGO` in `lib/brand/config.ts` to
  `{ kind: "image", src: "/brand/logo/wordmark.svg", alt: "Melanated Safaris" }`.
- `CityToursDividerBlock` renders its wordmark over a photo (not a flat
  background). If the supplied logo is dark-on-transparent, check that
  placement specifically once real photography is in — a reversed/light
  logo variant may be needed there. Not solved yet; flag if it comes up.

### Section icons

- Source of truth: `lib/brand/config.ts` → `BRAND_ICONS` (`globe`, `warning`).
- Consumed by `components/blocks/shared/BrandIcon.tsx`, used in
  `CityToursDividerBlock` (globe) and `ImportantItemsBlock` (warning
  triangle) — these are fixed, one-per-section icons, not catalog content.
- Currently `{ kind: "component", Icon: ... }`, rendering a generic
  `lucide-react` icon (`Globe`, `TriangleAlert`) instead of an emoji glyph —
  a higher-quality placeholder, still explicitly a stand-in, not the real
  commissioned icon.
- To activate a real icon: drop the icon file under `public/brand/icons/`,
  then change the matching entry to `{ kind: "image", src: "...", alt:
  "..." }`. Note the call sites (`CityToursDividerBlock.tsx`,
  `ImportantItemsBlock.tsx`) pass a `size-*` className sized for an SVG
  icon; an `<img>` replacement should keep an explicit pixel size rather
  than relying on the same class.
- Do **not** confuse these with the per-row icons in `ImportantItemsBlock`
  (passport, visa, shell — `row.icon`) or `WeatherBlock` (`season.icon`).
  Those come from seed/catalog data, not this config, because each row is
  independent content. If custom illustrations are commissioned for those,
  replace the emoji per record in `lib/db/seed.ts` (and the catalog editor
  once it supports icon uploads) — that is a content task, not a brand-pack
  import.

### Fonts

- The document currently renders two roles: a heading/display treatment
  (Tailwind `font-serif`, used for titles and italic accents across most
  blocks) and body text (Tailwind `font-sans`, default). This two-role setup
  is a deliberate simplification of the original PDF's seven named fonts —
  see "Fidelidad visual" in the root `CLAUDE.md`. Do not wire more than two
  roles without a design decision first.
- `app/globals.css` resolves `--font-serif` → `--font-heading` →
  `--font-brand-heading` (falls back to the body sans font when unset). No
  component references a font by name directly, so this is the only file
  that needs to change.
- `lib/fonts.ts` centralizes font loading (currently Geist via
  `next/font/google`).
- To activate a licensed heading font:
  1. Add the font files under `public/brand/fonts/heading/`.
  2. In `lib/fonts.ts`, load it with `next/font/local` and
     `variable: "--font-brand-heading"`, then add that variable to
     `fontVariables`.
  3. Nothing else changes — `font-serif` picks it up everywhere
     automatically.
  - Repeat against `--font-sans` (variable name is already load-bearing —
    reuse the same pattern) if the body font also changes.
- `lib/designs/registry.ts` → `melanated-editorial.brand.headingFontFamily` /
  `bodyFontFamily` already point at `var(--font-heading)` / `var(--font-sans)`,
  so the design descriptor stays accurate without a separate edit.

## Content photography (data-driven, not config-driven)

Placeholder photography comes from `picsum.photos` in two places:

- `lib/db/seed.ts` — seeds the live database. **This is the file that
  matters**; replacing URLs here is what actually changes the product.
- `lib/sampleProposalData.ts` — legacy/reference dataset for isolated
  previews only (see root `CLAUDE.md`); lower priority.
- `app/preview/*/page.tsx` — isolated block-preview fixtures; cosmetic only.

There is no manifest for these because each is a distinct piece of content
(a specific hotel's room photo, a specific excursion's photo, a specific
day's itinerary photo, the cover photo, the From Owners team photo, the
Thank You closing photo). When real photography arrives:

1. Drop files under `public/proposal-assets/` (existing convention — see
   `cover-zebras-v1.png`) using descriptive names per subject.
2. Replace each `picsum.photos` URL in `lib/db/seed.ts` with the matching
   root-relative path.
3. Re-run `npm run db:seed` against a fresh database (see the "Seed script
   not idempotent" note in project memory — reset `sqlite_sequence` first,
   or proposal 1 becomes proposal 2).
4. Verify against `reference/pdf-pages/page-NN.png` per the root `CLAUDE.md`
   guidance before considering a page done.

## Closing Phase 9

Once the asset pack is in and steps above are applied, update the "Remaining
brand gate" section of `PHASE9_QUALITY_DEPLOYMENT.md` and the corresponding
"Pendientes conocidos" entries in `CLAUDE.md` — do not mark the brand
acceptance criterion complete until real assets with confirmed usage rights
are in place.
