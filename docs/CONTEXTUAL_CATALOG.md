# Proposal Studio — Contextual Catalog

**Status:** Phase 5 implemented  
**Updated:** 2026-08-21

## Experience

The Catalog opens as a Proposal Studio drawer and keeps the document visible as
the working context. Advisors can:

- switch between Hotels and Excursions;
- search name, description, city, or destination;
- filter by country, destination, and city;
- see whether an item is already in the proposal;
- add a catalog item without leaving the editor;
- create a missing hotel or excursion and add it immediately;
- update a reusable catalog default from the same contextual surface.

## Data-safety boundary

Adding a hotel creates a proposal booking plus its protected divider/detail
sections. Adding an excursion creates a proposal selection and, when necessary,
the destination divider/list sections. Duplicate proposal selections are
rejected server-side.

The interface distinguishes both editing paths:

- **Proposal-only:** use the selected page's Properties fields. Existing hotel
  and excursion snapshot behavior keeps overrides private to the proposal.
- **Catalog default:** use Update catalog default in the Catalog drawer. This is
  an explicit action and never rewrites proposal override payloads.

Every mutation verifies the proposal, catalog item, duplicate state, and active
design section compatibility before changing proposal composition.

## Missing-item creation and duplicate control

Hotel names and excursion titles are compared case-insensitively within the
selected city. A likely duplicate is rejected instead of creating another
catalog row. Required fields, prices, price units, and media URLs are validated
on the server.

## Media strategy

The current single-user stage accepts either a versioned local `/path` or an
HTTPS URL and stores ordered catalog image references. This supports local brand
assets and externally hosted photography without adding a fake upload layer.
Before production, uploads should use authenticated object storage, generated
asset IDs, image metadata, and derivative sizes; raw client filesystem paths
must never be persisted.

## Reusable itinerary content

Excursions are the first reusable itinerary content type and can be inserted
contextually. Dedicated multi-activity day templates are intentionally not
introduced as a second itinerary data model; they can be added later through
the same catalog contract once real reuse patterns establish the required
fields.

## Verification

- Catalog data is server-loaded and serialized into the shared editor shell.
- The live editor route returns successfully with locations, hotels, and
  excursions.
- Lint, TypeScript, production build, and diff integrity pass.
- Click-path and responsive screenshot validation remains part of the pending
  connected-browser checkpoint.
