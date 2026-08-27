# Brand asset pack — import pipeline

**Status:** partially imported (2026-08-27). Typography and the logo slot now
carry real assets; photography and the commissioned icons do not, so this is
still the last open criterion of Phase 9 — see `PHASE9_QUALITY_DEPLOYMENT.md`.

## What still needs to arrive

- **The vector or high-resolution logo.** What ships today was extracted from
  `reference/pdf-pages/page-01.png` (the only copy of the mark in the repo) at
  the owner's explicit direction, and is an interim asset: 169x64 px, sharp at
  the sizes the document uses but with no headroom above them.
- **Founder and travel photography.** Still Picsum placeholders; see the
  data-driven section below.
- **Commissioned section icons.** The `globe` and `warning` slots still render
  generic stand-ins.

Fonts are done: the display and script roles ship OFL-licensed faces (below).

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
- **Live since 2026-08-27:** `{ kind: "image", src: "/brand/logo/wordmark.png",
  srcOnDark: "/brand/logo/wordmark-on-dark.png", alt, width: 169, height: 64 }`.
  Both files were extracted from `reference/pdf-pages/page-01.png`: the paper
  white was unpremultiplied into a real alpha channel so the mark composites
  over photos, and the reversed variant recolours the unsaturated ink (the
  "SAFARIS" line and the fist's outlines) to white while the tricolour letters
  keep their hue.
- To replace it with the owner's original: drop the file at
  `public/brand/logo/wordmark.svg` (or `.png`) and update `src` plus
  `width`/`height` (the intrinsic pixels, used only for the aspect ratio).
  Drop `srcOnDark` if the supplied mark already reads on dark.
- **Sizing is a component concern, not a call-site one.** A stacked logo (icon
  over wordmark over "SAFARIS") cannot inherit the 1em of the 10px uppercase
  rules the call sites use, so `BrandWordmark` renders images at `h-[3.4em]`
  by default; `CoverBlock` overrides it to 62px, matching page-01. Text mode
  still inherits its line, unchanged.
- **The dark-placement caveat is resolved.** `CityToursDividerBlock` renders
  its wordmark over a photo and passes `onDark`, which swaps in the reversed
  variant. The minimal-grid renderer's equivalent sits on a light surface and
  does not.
- Side effect worth knowing: `SectionDividerBlock`'s title started at
  `pt-[110px]`, which crowded the real mark once it replaced the small text
  wordmark. It moved to `pt-[168px]`, which is also where
  `reference/pdf-pages/page-20.png` puts it.

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

**Done — the document ships real type as of 2026-08-27.**

- **Display role** (`font-serif` / `font-heading`): **Prata**, the high-contrast
  serif the original PDF uses for the cover title. Loaded in `lib/fonts.ts` via
  `next/font/google` under `--font-brand-heading`, which is the variable
  `app/globals.css` already resolved to. Single weight (400), no italic.
- **Script role** (`font-script`): **Allura**, for the handwritten accents —
  "thank you", the divider subtitles, the cover's client line. This is a
  **third** typographic role, approved by the owner on 2026-08-27 after seeing
  the alternative (slanted Prata, which reads as a formal didone, not as the
  original's handwriting). Never combine it with `italic`: the face is already
  slanted, and Tailwind would synthesise a second slant on top.
- **Body role** (`font-sans`): unchanged, still Geist. The original's body face
  (Muli) has not been wired — swapping it would move every line break in the
  document, and the paginator's budgets are tuned around the current metrics.
- Both new faces are OFL licensed, so no rights handoff is pending for them.
- The design descriptor (`lib/designs/registry.ts` →
  `brand.headingFontFamily`/`bodyFontFamily`) has no field for a script role.
  That is deliberate: adding one changes the versioned design contract. The
  role lives purely in the CSS variable chain.
- Do not add a fourth role without another design decision.
- `app/globals.css` resolves `--font-serif` → `--font-heading` →
  `--font-brand-heading`, and `--font-script` → `--font-brand-script` (each
  falling back down the chain when unset). No component references a font by
  name directly, so this is the only file that needs to change.
- `lib/fonts.ts` centralizes font loading.
- `tests/fixtures/google-fonts.cjs` mocks every Google font the app requests so
  the E2E build never touches the network. **Adding a font means adding its
  `css2?family=...` URL there too**, or the offline build fails.
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
