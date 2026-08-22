# Proposal Studio — Travel-native Itinerary Editor

**Status:** Phase 4 implemented  
**Updated:** 2026-08-21

## User experience

The itinerary is edited as an ordered collection of day cards instead of raw
parser syntax. Each day supports:

- date, subtitle, and highlight;
- ordered activities with optional time ranges;
- one or more narrative paragraphs;
- ordered local or HTTPS image references;
- move, duplicate, and delete actions;
- expanded and condensed editing density;
- estimated pagination warnings.

Adding or reordering days automatically regenerates sequential day numbers.
Overview and Day Itinerary pages continue to share the same canonical dataset.

## Persistence boundary

`ItineraryEditor.tsx` converts structured client state through
`itineraryEditorCodec.ts`. The existing `updateProposalFields` Server Action
performs the canonical validation and replaces the proposal-owned day/activity/
paragraph/image graph in one transaction. The server and client now share the
same parser, preventing grammar drift while preserving compatibility with the
previous textarea format.

The save remains explicit because it replaces an ordered relational graph.
Unsaved itinerary changes participate in the editor's global dirty-state and
navigation protection.

## Pagination guidance

The overflow notice is deliberately an estimate. It weighs activity count,
image count, and narrative length and directs the advisor to review the
rendered result. It does not change page geometry or silently truncate content.

## Verification

- Shared parser/serializer round-trip passes for day metadata, activities,
  paragraphs, and images.
- Invalid days without activities are rejected.
- Lint, TypeScript, production build, and diff integrity pass.
- Rendered interaction validation remains part of the pending connected-browser
  checkpoint described in `EDITOR_DESIGN_CRITIQUE.md`.
