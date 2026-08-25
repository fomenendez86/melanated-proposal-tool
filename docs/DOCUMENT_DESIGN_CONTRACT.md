# Proposal Studio — Document Design Contract

**Status:** Phase 3.3 implemented; editable-region annotation added in Phase 10.1  
**Updated:** 2026-08-22

## Purpose

The document design contract lets one Proposal Studio shell work with multiple
versioned proposal designs. The shell owns navigation and editing behavior; a
design descriptor owns document presentation capabilities. Saved proposal
content remains independent from both.

## Runtime boundary

```text
proposal content ──┐
                   ├─► server loader ─► registered design + compatibility
saved design id ───┘                         │
                                            ├─► server-rendered pages
                                            └─► serializable design context
                                                        │
                                                        ▼
                                                  editor shell
                                       page geometry / selector / warnings
```

- `lib/designs/types.ts` is the serializable contract shared with the client.
- `lib/designs/registry.ts` is the server-owned registry and default resolver.
- `lib/db/getProposalDesignContext.ts` combines the saved identity, registry,
  and section compatibility into the context consumed by the editor.
- `designActions.ts` validates and commits design changes on the server.
- The shell does not know design-specific colors, layouts, section order, or
  Tanzania content. It consumes only page geometry and design metadata.

## Descriptor fields

| Field | Responsibility |
| --- | --- |
| `id` + `version` | Stable identity used for persistence and reproducibility |
| `name`, `description`, `status` | Proposal-workflow presentation |
| `previewImageUrl` | Design picker preview asset |
| `page` | Width, height, format label, and orientation |
| `brand` | Document-only color and typography tokens |
| `supportedSectionTypes` | Compatibility allowlist |
| `sectionVariants` | Approved presentation choices per section type |
| `defaultVariantIds` | Deterministic variant fallback per section type |
| `rendererId` | Server renderer registration handle |
| `editorSchemaId` | Structured field-schema registration handle |

All client-facing values are serializable. React components, database clients,
and mutation functions are deliberately excluded from the descriptor.

## Versioning rules

1. A breaking renderer, schema, default, or geometry change creates a new
   version; it does not mutate an existing registered version.
2. A proposal stores both `designId` and `version`.
3. Missing or retired identities resolve safely to the registered default while
   leaving proposal content untouched.
4. Historical proposal revisions must eventually snapshot the same identity so
   regenerated output stays reproducible.

## Persistence decision

**Resolved (Fase 12.1).** The identity lives in explicit `designId`/
`designVersion` columns on `proposals` (`lib/db/schema.ts`), read by
`lib/db/getProposalDesignContext.ts` and written by
`app/proposals/[id]/editor/designActions.ts`. This replaced the interim
proposal-scoped virtual `proposal_sections` row (`sectionType =
"documentDesign"`) described in earlier versions of this document — the
public loader and action contract did not change when storage moved, as
planned.

Every `proposal_revisions` row also snapshots the identity independently
(`designId`/`designVersion` columns plus the full `design` descriptor JSON,
alongside the rendered `data`) at the moment a share link is created, so an
already-shared revision keeps rendering with the design it was created
against even if the proposal's live selection changes afterward.

## Safe switching

1. The client shows all registered choices and disables known incompatible
   options.
2. The server repeats compatibility validation against canonical saved
   sections; client checks are never trusted as authorization.
3. Dirty form data must be resolved before switching.
4. A compatible switch requires explicit confirmation.
5. The identity update and proposal timestamp change occur in one transaction.
6. Failure returns a structured error and leaves the prior identity active.
7. Saved content is never deleted or rewritten by a design switch.

## Current fixtures

- **Safari Editorial v1** is the active reference design, `rendererId:
  "melanated-blocks-v1"` (`components/renderers/melanatedBlocksV1.tsx`).
- **Minimal Grid v1** is a retired preview fixture kept registered only for
  reproducibility (versioning rule 1 below) — it proved registration,
  serialization, compatibility, selection, and persistence, reusing Safari
  Editorial's renderer. It is excluded from selection UIs (see
  `listSelectableDocumentDesigns()`); nothing should route users to it.
- **Minimal Grid v2** is a preview-status design with its own real renderer,
  `rendererId: "minimal-grid-v1"` (`components/renderers/minimalGridV1.tsx`,
  block components under `components/blocks/minimal-grid/`) — a structured,
  hairline-grid layout genuinely distinct from Safari Editorial (no
  clip-path/triangle geometry, no italics, off-white surface), not a
  recolor. `ProposalRenderer.tsx` routes to a renderer by looking up
  `design.rendererId` in a `RENDERERS` map, falling back to
  `melanated-blocks-v1` for unrecognized ids (legacy snapshots, call sites
  with no resolved design).

All three registered identities support every section type (Minimal Grid v2
built its own component for each). Compatibility behavior remains meaningful
for future partial designs and is enforced on both client and server.

Registering a new renderer under an existing design `id` must bump `version`
rather than mutate the registered entry in place (see "Versioning rules"
below) — this is exactly how Minimal Grid v2 was added alongside v1.

## Failure and rollback

- An unknown design, invalid proposal, unsupported section, or transaction
  failure returns an error without changing content.
- The default design keeps older proposals renderable when no identity exists.
- Rollback is selecting the prior registered identity; no content restoration
  is required because switching does not mutate content.

## Editable regions (Phase 10.1)

Design renderers declare which DOM elements display an editable value by
annotating them with `data-edit-field` and `data-edit-kind` through
`editableRegion()` in `lib/editor/editableRegions.ts`.

- `data-edit-field` must be a `ProposalEditorFieldName` — the same typed union
  that drives the Properties inspector schema in `getProposalEditorData.ts`.
  TypeScript enforces the single source of truth; a renderer cannot annotate a
  field that the inspector does not know.
- `data-edit-kind` is `text`, `multiline`, or `image` and describes the
  editing affordance the shell should offer in later phases.
- Aggregated collections that edit through one inspector field (itinerary,
  excursions, weather, terms, important items, list columns, payment schedule)
  annotate their rendered container with that single aggregated field name.
  When a collection spans several document pages, each page's container
  carries the same field.
- Rows assembled from generic view-model shapes (`DetailRow`, `KeyValueLine`)
  carry an optional `editField` set during server data assembly; renderers
  spread the region only when it is present. The combined airport row focuses
  `arrivalAirport`, the first of its two fields.
- The shell discovers regions by DOM delegation inside the rendered page
  container and resolves the owning page through its `data-page-index`
  wrapper. It never imports renderers and never branches on section types.
- The attributes are inert metadata everywhere else: page thumbnails, preview,
  share, and PDF output include them with no visual or behavioral effect. The
  shell's delegation is scoped to the canvas, so annotated thumbnails never
  become interactive.
- A design may annotate only part of its fields; regions are a progressive
  entry point to the inspector, not a coverage requirement. Safari Editorial
  annotates every content-bearing block; Minimal Grid inherits those
  annotations only where it reuses the same renderers.

## Next integration boundary

Renderer registries are now executable (`RENDERERS` map in
`ProposalRenderer.tsx`, keyed by `rendererId`) rather than identifier-only,
and Minimal Grid v2 has a complete renderer, closing the gap this section
used to describe. Still open: a visual design picker with previews (today's
picker is a plain `<select>`), testing the shell at desktop/mobile sizes
with two real designs in rotation, and making pagination
(`lib/paginate.ts`) design-aware — it is still generic/shared across
renderers today, so Minimal Grid v2's four dynamically-paginated block
types (Overview, DayItinerary, ExcursionList, TermsConditions) were built
to preserve Safari Editorial's line-height and column-width budgets rather
than getting their own tuned constants. A design with a meaningfully
different text density on those block types would need that work done
first.
