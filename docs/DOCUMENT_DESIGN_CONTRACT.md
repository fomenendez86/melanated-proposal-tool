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

- **Safari Editorial v1** is the active reference design.
- **Minimal Grid v1** is a preview fixture that proves registration,
  serialization, compatibility, selection, and persistence. It intentionally
  reuses the current block renderer and editor schema; it is not yet a complete
  second visual template.

Both fixtures support all current section types. Compatibility behavior remains
meaningful for future partial designs and is enforced on both client and server.

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

Phase 3.4 should make renderer and editor-schema registries executable rather
than identifier-only, add a visual design picker with previews, and test the
shell at desktop/mobile sizes. A complete Minimal Grid renderer belongs after
that contract integration, not inside the editor shell.
