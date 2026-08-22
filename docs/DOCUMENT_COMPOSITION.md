# Proposal Studio — Document Composition

**Status:** Phase 6 implemented  
**Updated:** 2026-08-21

## Composition surface

Document Structure is a proposal-scoped drawer. It lists source sections rather
than generated pagination chunks and supports:

- adding compatible image/title, editorial divider, and thank-you blocks;
- adding catalog-backed hotels and excursions through Catalog;
- deterministic move up/down ordering;
- duplication;
- hide/show without deleting data;
- recoverable delete/restore;
- proposal-scoped approved layout variants from the Design inspector.

The current product intentionally uses explicit controls instead of drag-only
ordering so keyboard and touch users receive the same functionality.

## Recovery model

Delete is logical: the source row and related proposal/catalog records remain
intact with `deleted` and `hidden` composition flags. Restore reverses both
flags. This supplies a durable undo path for the destructive operation that
would otherwise be hardest to recover. Reorder, visibility, and variants remain
explicit reversible commands; a general command-stack undo/redo system can be
added later if composition activity proves frequent enough to justify persisted
history.

## Readiness model

`proposalPageMeta` now computes `ready`, `warning`, or `error` from rendered
content. Missing required content produces errors; missing presentation media
or incomplete supporting details produce warnings. Page cards expose non-ready
states, and Proposal Review aggregates them with save and design compatibility.
Hidden/deleted source sections stay available in Document Structure but do not
render or enter readiness checks.

## Safety

- Mutations verify section ownership and exclude virtual metadata rows.
- Add and variant actions verify active-design compatibility server-side.
- Catalog-dependent sections cannot be fabricated without their required data.
- All composition changes update proposal timestamps and revalidate editor and
  preview routes.
- No operation deletes relational content or silently changes catalog defaults.

## Verification

Lint, TypeScript, production build, live editor rendering, and diff integrity
pass. The pending connected-browser checkpoint still covers drag-free keyboard
flows, drawer focus, and representative responsive screenshots.
