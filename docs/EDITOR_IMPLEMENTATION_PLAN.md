# Melanated Safaris Proposal Studio — Implementation Plan

## 1. Product direction

Build a proposal-first visual editor inspired by Proposify, TravelJoy, Travefy,
MOGU, and Qwilr. The proposal is the center of the product; catalog management
is contextual support, not a separate administrative application.

The editor must feel visual while preserving the fixed, validated layouts used
to generate Letter-size PDFs. Users edit structured content and choose approved
layout variants. They do not freely position elements by coordinates.

### Primary outcome

An advisor can create, assemble, review, and generate a client-ready travel
proposal without editing code or manually repairing page layouts.

### Product principles

1. **Proposal first:** every primary action advances the current proposal.
2. **Visual confidence:** changes are visible in a faithful page preview.
3. **Protected layouts:** content is editable; core geometry is controlled.
4. **Contextual catalog:** reusable content is available without leaving the
   editor.
5. **Safe history:** a sent proposal must not change unexpectedly when catalog
   records change later.
6. **Progressive complexity:** new users get a guided start; experienced users
   can move directly through the visual editor.

### Explicit non-goals

- A general-purpose admin dashboard.
- A freeform Canva/Figma-style canvas.
- CRM, accounting, commissions, or operational reporting.
- Real-time multi-user collaboration in the initial release.
- Client payments and e-signatures in the initial release.

## 2. Target experience

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Proposals   Tanzania Safari · Draft   Saved ✓                     │
│ Undo  Redo        Client preview        Share        Generate PDF    │
├───────────────┬──────────────────────────────┬───────────────────────┤
│ PAGES         │ DOCUMENT                     │ PROPERTIES            │
│               │                              │                       │
│ 01 Cover      │      Selected Letter page    │ Contextual fields     │
│ 02 Owners     │                              │ Images                │
│ 03 Details    │      protected layout        │ Layout variants       │
│ 04 Overview   │                              │ Validation            │
│ 05 Hotel      │                              │ Add from catalog      │
│ + Add section │                              │                       │
├───────────────┴──────────────────────────────┴───────────────────────┤
│ 32 pages · 2 incomplete items · Last saved 10 seconds ago           │
└──────────────────────────────────────────────────────────────────────┘
```

On smaller screens, Pages and Properties become drawers. The document remains
the main surface.

## 3. Architecture

### High-level components

```text
SQLite / Drizzle
      │
      ▼
Server data loaders ──► proposal view model ──► Server-rendered page blocks
      │                                               │
      │                                               ▼
      └────► Server Actions / validation       Client editor shell
                                                      │
                                                      ├─ page navigation
                                                      ├─ zoom / selection
                                                      ├─ draft editing state
                                                      └─ save / preview actions

Playwright PDF service ◄── stable proposal preview route
```

### Server/client boundary

- Database access and proposal assembly remain server-only.
- PDF blocks remain Server Components where needed. This is important because
  `ImportantItemsBlock` generates QR codes asynchronously.
- The interactive shell is a Client Component that receives serializable page
  metadata and server-rendered page nodes.
- Mutations will use Server Actions with schema validation and return structured
  field errors.
- The preview and PDF routes render saved data, never unsaved client state.

### Planned routes

| Route | Purpose |
| --- | --- |
| `/` | Redirect to the active/default proposal during the single-user phase. |
| `/proposals/[id]/editor` | Main visual editor. |
| `/proposals/[id]/preview` | Clean client/PDF preview. |
| `/proposals/[id]/new` | Optional guided creation flow once multiple proposals are enabled. |
| `/api/proposals/[id]/pdf` | Later: generate or download a PDF for a saved revision. |

### Core editor state

The editor will eventually distinguish three layers:

1. **Saved server state** — canonical database values.
2. **Local draft state** — current form changes not yet persisted.
3. **Proposal revision/snapshot** — immutable data used for sent proposals and
   regenerated PDFs.

Phases 1 and 1.2 introduce navigation state: selected page, zoom, view mode,
and panel state.

## 4. Delivery phases

## Phase 1 — Visual editor foundation

### Scope

- Create `/proposals/[id]/editor` using an async dynamic route compatible with
  Next.js 16.
- Load proposal metadata and assembled page data on the server.
- Add the desktop editor shell:
  - top toolbar;
  - page navigator;
  - central scaled page canvas;
  - contextual read-only properties panel;
  - footer status bar.
- Support page selection, previous/next navigation, and zoom controls.
- Add `/proposals/[id]/preview` for a clean full-document view.
- Redirect `/` to the seeded proposal editor.
- Preserve all existing standalone block preview routes and PDF rendering.

### Acceptance criteria

- `/proposals/1/editor` displays every generated page and can navigate between
  them without a reload.
- The selected page label, number, type, and validation placeholder appear in
  the Properties panel.
- Zoom changes the center canvas without changing PDF geometry.
- “Client preview” opens the clean dynamic preview route.
- `/` no longer shows the Create Next App starter.
- Existing `/preview/*` routes continue working.
- Lint has no new errors and the production build succeeds.

### Deliberately deferred

- Persistent editing.
- True miniature page previews if duplicating every heavy page harms runtime
  performance; the first implementation may use structured page cards.
- Catalog drawer.
- Drag-and-drop ordering.
- PDF generation from the toolbar.

## Phase 1.2 — Continuous document navigation

**Status: Complete (2026-08-21).**

### Scope

- Make continuous vertical document scrolling the editor default.
- Keep native trackpad, mouse-wheel, touch, and scrollbar behavior; do not
  convert wheel gestures into discrete page jumps.
- Detect the page nearest the viewport center and synchronize it with the page
  navigator, toolbar counter, and Properties panel.
- Scroll the document to the corresponding page when a thumbnail, previous/next
  control, or PageUp/PageDown shortcut is used.
- Offer Continuous and Single page viewing modes without changing PDF geometry.
- Fit continuous mode to the available width and single-page mode to the full
  available viewport; keep manual zoom available in both modes.
- Keep page virtualization as a measured performance optimization for larger
  documents rather than adding its complexity before it is needed.

### Acceptance criteria

- Normal scrolling moves naturally across all pages in document order.
- The active thumbnail and contextual properties update as the viewport crosses
  into another page.
- Selecting a page from the navigator scrolls to it without reloading.
- Previous/next and PageUp/PageDown navigate consistently in both view modes.
- Continuous mode works on desktop and touch-sized screens without horizontal
  overflow at fit width.
- Single-page mode remains available on screens where the view toggle is shown.
- Lint and the production build succeed.

## Phase 2 — Structured content editing and save

**Status: In progress. Phase 2.1 complete (2026-08-21).**

### Phase 2.1 delivered

- Editable Cover and Proposal Details property forms.
- Proposal-scoped field allowlists and server-side length, required-value, and
  image URL validation.
- Debounced autosave, immediate save on leaving the form, and a manual Save now
  fallback.
- Distinct Loaded, Unsaved, Saving, Saved, and Error feedback.
- Database transactions for proposal/client updates and revalidation of both
  editor and client preview routes.
- Reload-tested persistence without writing to shared catalog records.

### Phase 2.2 next

- Add proposal-specific override storage for hotel, excursion, reusable list,
  weather, terms, and closing content before enabling those property forms.
- Never edit shared catalog/template defaults implicitly from a proposal.

### Scope

- Define an editor schema for each `ProposalSection` type.
- Add contextual property forms for cover, details, hotels, excursions,
  pricing, lists, terms, weather, and thank-you content.
- Add Server Actions for focused mutations rather than sending an entire
  proposal graph on every edit.
- Add validation, dirty-state indicators, save feedback, and error recovery.
- Add debounced autosave for text fields and explicit save for destructive or
  high-impact operations.
- Refresh server-rendered previews after successful saves.

### Acceptance criteria

- Editing supported fields persists to SQLite and survives a reload.
- Invalid values show field-level errors without corrupting saved data.
- The preview refreshes from canonical saved data.
- Unsaved/failed changes are visibly distinguishable from saved changes.

## Phase 3 — Travel-native itinerary editor

### Scope

- Add a specialized day timeline rather than forcing itinerary data into
  generic property fields.
- Add, edit, duplicate, delete, and reorder days.
- Add, edit, and reorder activities within a day.
- Manage day images and image order.
- Add condensed and expanded editing modes.
- Provide warnings when estimated pagination may overflow.

### Acceptance criteria

- A complete itinerary can be created without direct database work.
- Day and activity ordering is deterministic after reload.
- Pagination updates correctly after itinerary changes.

## Phase 4 — Contextual catalog

### Scope

- Add a searchable drawer for hotels, excursions, destinations, and reusable
  itinerary content.
- Filter by country, destination, city, category, and status.
- Insert catalog items into the current proposal.
- Support “Edit only this proposal” versus “Update catalog default.”
- Add lightweight creation of a missing hotel or excursion from the selector.
- Add media selection and upload strategy.

### Acceptance criteria

- Users can find and insert reusable content without leaving the editor.
- Proposal-specific overrides never silently mutate catalog defaults.
- Duplicate catalog entries are detectable and preventable.

## Phase 5 — Document composition

### Scope

- Add section picker with visual block types.
- Reorder, duplicate, hide, and delete sections.
- Add approved layout variants per compatible block.
- Add page/section validation states: complete, warning, error, hidden.
- Add undo/redo for editor operations.
- Add a pre-generation readiness review.

### Acceptance criteria

- Users can assemble a proposal from blocks while all output remains printable.
- Destructive actions require confirmation and can be recovered through undo
  where practical.
- Required content is checked before PDF generation.

## Phase 6 — Reliable PDF generation

### Scope

- Replace the fixed local render script workflow with proposal-specific PDF
  generation.
- Generate from `/proposals/[id]/preview` or an immutable revision route.
- Produce unique filenames and downloadable responses.
- Add loading, failure, retry, and success states in the toolbar.
- Record generation metadata and optionally retain generated artifacts.
- Decide between synchronous generation and a background job based on measured
  generation time and deployment limits.

### Acceptance criteria

- “Generate PDF” produces the selected saved proposal without requiring a
  manually started development server.
- Concurrent proposals cannot overwrite each other's output.
- Failed renders give actionable feedback and can be retried safely.

## Phase 7 — Client proposal experience

### Scope

- Add a polished, mobile-responsive shared proposal view.
- Add optional hotel/package/excursion comparisons.
- Support approval or selection recording without adding payment scope.
- Add optional password protection and expiration.
- Track basic lifecycle events: shared, opened, approved, expired.

### Acceptance criteria

- A client can review the proposal on desktop or mobile without the editor UI.
- Options and approvals are clearly recorded against the correct revision.
- Private proposals cannot be accessed without their configured protection.

## Phase 8 — Brand fidelity, quality, and deployment

### Scope

- Replace placeholder fonts, logo, icons, illustrations, and Picsum images.
- Complete the missing hotel and Karatu catalog/proposal content.
- Improve heuristic pagination with measured overflow detection where needed.
- Add unit tests for pagination and data assembly.
- Add integration tests for mutations and proposal snapshots.
- Add Playwright end-to-end and PDF smoke tests.
- Add accessibility checks for the editor.
- Choose a production persistence strategy; local SQLite alone is not suitable
  for every serverless deployment model.
- Add backup, observability, and recovery procedures.

### Acceptance criteria

- Critical editor and PDF flows have automated coverage.
- Production data persists across deployments and can be restored.
- Final output uses approved Melanated Safaris brand assets.
- Known pagination limits are measured, documented, and surfaced to users.

## 5. Data integrity and revision strategy

Catalog rows are living defaults. Sent proposals must be historical records.
Before client sharing is enabled, introduce proposal revisions containing a
snapshot of every value required to reproduce the document, including:

- client and traveler display data;
- itinerary text and dates;
- hotel names, descriptions, rooms, meal plans, and images;
- excursion descriptions, prices, notes, and images;
- proposal pricing and payment schedule;
- company identity, bank details, requirements, and terms version;
- section order, payloads, and selected layout variants.

A catalog update can then be explicitly applied to a draft, but cannot silently
change a sent revision.

## 6. Reliability and error handling

- Unknown proposal IDs render a not-found state.
- Every mutation validates ownership/scope and input values on the server.
- Autosave operations use request identifiers or versions to avoid stale writes.
- Reordering uses transactions and normalized sort positions.
- PDF generation reads a saved revision and records failures separately from
  editor state.
- Image failures show placeholders and block generation only when the image is
  required.

## 7. Trade-offs

### Protected layouts over freeform positioning

**Benefit:** reliable PDFs, faster implementation, consistent brand.
**Cost:** users cannot make arbitrary visual adjustments.

### Server-rendered blocks inside a client shell

**Benefit:** keeps database and QR generation server-side and reuses validated
blocks.
**Cost:** unsaved edits require a refresh or a separate lightweight client
preview strategy in Phase 2.

### SQLite during local development

**Benefit:** simple, fast, and already integrated.
**Cost:** production hosting options are constrained; the persistence choice
must be revisited before deployment.

### Autosave

**Benefit:** low-friction editing similar to modern proposal tools.
**Cost:** requires conflict handling, visible save states, and careful treatment
of destructive changes.

## 8. Decisions to revisit as usage grows

- Whether page rendering needs virtualization for very long proposals.
- Whether PDF generation should move to a queue/worker.
- Whether generated PDFs belong in object storage.
- Whether multiple users require permissions and proposal locking.
- Whether client analytics justify a web-proposal event pipeline.
- Whether SQLite should move to a managed relational database.
- Whether catalog search needs full-text indexing.

## 9. Current status

- [x] Existing PDF block system and database-backed proposal assembly.
- [x] Phase 1 — visual editor foundation.
- [x] Phase 1.1 — responsive and accessibility quality pass.
- [x] Phase 1.2 — continuous document navigation.
- [ ] Phase 2 — persistent structured editing.
- [ ] Phase 3 — itinerary editor.
- [ ] Phase 4 — contextual catalog.
- [ ] Phase 5 — document composition.
- [ ] Phase 6 — PDF generation workflow.
- [ ] Phase 7 — client proposal experience.
- [ ] Phase 8 — brand, testing, and deployment readiness.
