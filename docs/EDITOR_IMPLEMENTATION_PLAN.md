# Melanated Safaris Proposal Studio — Implementation Plan

## 1. Product direction

Build a multi-design, proposal-first visual editor inspired by Proposify,
TravelJoy, Travefy, MOGU, and Qwilr. The proposal editor is the product. It must
support multiple document designs without creating a separate editor for every
design. Catalog management is contextual support, not a separate administrative
application.

The existing Melanated Safaris/Tanzania document is the first reference design
and a test fixture for the platform. It is not the permanent global structure
for every future proposal.

The editor must feel visual while preserving fixed, validated, print-ready
layouts. Letter is the current reference size; page dimensions belong to each
design definition. Users edit structured content and choose approved layout
variants. They do not freely position elements by coordinates.

### Primary outcome

An advisor can create, assemble, review, and generate a client-ready travel
proposal in any supported document design without editing code, learning a
different editor, or manually repairing page layouts.

### Immediate objective

Form coverage for every content-bearing block in the reference document is now
complete. The immediate objective returns to the editor's information
architecture, visual hierarchy, interaction model, responsive behavior, and
multi-design contract.

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
7. **One editor, many designs:** editor chrome and core interactions stay
   consistent; document renderers, section variants, and brand tokens are
   supplied by the selected design.
8. **No template assumptions in the shell:** the editor must not hardcode page
   counts, section order, Tanzania-specific fields, or a single visual system.

### Explicit non-goals

- A general-purpose admin dashboard.
- A freeform Canva/Figma-style canvas.
- A separate editor implementation for each proposal design.
- CRM, accounting, commissions, or operational reporting.
- Real-time multi-user collaboration in the initial release.
- Client payments and e-signatures in the initial release.

## 2. Target experience

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Proposals   Tanzania Safari · Draft   Saved ✓                     │
│ Design: Safari Editorial   Preview design   Share     Generate PDF   │
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

### Multi-design boundary

The system must keep these layers separate:

1. **Proposal Studio shell** — toolbar, page navigator, canvas, inspector,
   dialogs, feedback, keyboard behavior, responsive layout, and accessibility.
2. **Document design definition** — design identity/version, thumbnail, page
   size, brand tokens, supported section types, approved variants, defaults,
   and renderer/editor registrations.
3. **Proposal content** — client, itinerary, commercial, and proposal-specific
   override data.
4. **Rendered document** — paginated pages produced by applying content to the
   selected design definition.

Changing a design may change page geometry and available variants, but it must
not change the Proposal Studio navigation model. Compatibility checks must
identify unsupported sections before a design switch is committed.

### High-level components

```text
SQLite / Drizzle
      │
      ▼
Server data loaders ──► proposal view model ──► selected design definition
      │                                               │
      │                                               ▼
      └────► Server Actions / validation       Server-rendered page blocks
                                                      │
                                                      ▼
                                               Client editor shell
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
- The shell receives design-neutral page metadata. Design-specific renderers
  and property schemas are registered outside the shell.

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

### Planned design identity

- Every proposal references a `designId` and version; this identity is saved
  with revisions so historical output remains reproducible.
- A design registry resolves that identity to renderers, property schemas,
  supported section types, variants, defaults, and page geometry.
- Page metadata includes stable proposal source references and design-neutral
  labels; it does not import brand-specific UI into the shell.
- Design switching is a validated proposal operation, not a cosmetic client
  preference.

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

**Status: Complete (2026-08-21).**

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

### Phase 2.2 delivered

- Stable page-to-source references that survive automatic pagination.
- Proposal-only forms for hotel booking details and pricing values.
- Proposal-section payload editing for triangle dividers, image dividers, city
  tour introductions, and the closing page.
- Currency-aware pricing rendering with validation for non-negative amounts and
  three-letter currency codes.
- Ownership checks for every booking and section mutation; catalog hotel values
  remain unchanged when proposal booking overrides are edited.

### Phase 2.3A delivered

- Explicit-save editors for proposal inclusions and exclusions using a readable
  `[Heading]` plus list-item format for each printed column.
- Explicit-save payment schedule editor using one `Label | Value` row per
  payment.
- Server-side parsers with field errors that reject malformed collections
  before any database writes occur.
- Transactional replacement of parent/child list rows and payment rows.
- Unsaved-change confirmation when navigating away from an explicit-save form;
  continuous-scroll selection stays pinned while that form is dirty.

### Phase 2.3B delivered

- Proposal-private JSON snapshots for excursion copy, weather tables, and terms
  without modifying shared catalog or template defaults.
- Explicit-save collection editors with strict server-side parsing and
  field-level format errors.
- A single aggregated editor value for collections that render across multiple
  document pages.
- Automatic repagination after save, with a clamped page selection when the new
  page count is shorter.
- Browser-tested validation, SQLite persistence, and reload behavior for all
  three snapshot types.

### Phase 2.3C delivered

- Proposal-only From Owners message, signatures, and photo editing through a
  virtual override section with company data as the untouched fallback.
- Proposal-private Important Items snapshots with icon, color, QR URL, and
  bullet validation.
- Hotel name, description, and three image overrides alongside room, meal plan,
  and nights, without changing hotel catalog records.

### Phase 2.4 delivered

- One explicit-save canonical itinerary editor covering days, dates, subtitles,
  highlights, activities, paragraphs, and images.
- The same source editor is exposed from Overview and Day Itinerary pages.
- The relational day graph is replaced transactionally and both block types
  repaginate from the saved result.
- Validation, persistence, reload, and QA restoration were browser-tested.
- The richer timeline interaction remains a Phase 4 enhancement; data coverage
  no longer depends on it.

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

## Phase 3 — Editor design and multi-design foundation

**Status: Current priority.**

### Phase 3.1 — Editor UX specification

**Status: Complete (2026-08-21).** The detailed interaction and visual baseline
is maintained in [`EDITOR_UX_SPEC.md`](EDITOR_UX_SPEC.md).

- Define the primary workflows: choose design, edit content, navigate pages,
  add content, review issues, preview, and generate.
- Finalize the information hierarchy of toolbar, Pages panel, document canvas,
  Properties inspector, and contextual catalog entry points.
- Specify selected, hover, loading, empty, dirty, saving, saved, invalid,
  incompatible, and disabled states.
- Define desktop, tablet, and mobile behavior before adding more controls.
- Distinguish document-level settings, section-level properties, and
  element/content fields in the inspector.

### Phase 3.2 — Reusable editor design system

**Status: Complete (2026-08-21).** Semantic tokens and shared primitives are
documented in [`EDITOR_DESIGN_SYSTEM.md`](EDITOR_DESIGN_SYSTEM.md). The shell
uses standardized buttons, fields, notices, headers, inspector sections,
segmented controls, page cards, status badges, drawers, and empty states.

- Extract editor-only colors, typography, spacing, borders, shadows, focus
  rings, control sizing, and motion into reusable tokens.
- Standardize toolbar controls, segmented controls, page cards, inspector
  groups, field rows, notices, dialogs, drawers, and empty states.
- Keep editor branding neutral enough that document designs remain visually
  distinct inside the canvas.
- Complete keyboard, focus, contrast, and touch-target behavior for all primary
  editor interactions.

### Phase 3.3 — Document design contract

**Status: Complete (2026-08-21).** The versioned serializable contract,
registry, persistence decision, compatibility rules, and rollback behavior are
documented in [`DOCUMENT_DESIGN_CONTRACT.md`](DOCUMENT_DESIGN_CONTRACT.md).
The editor now displays and safely changes its proposal-scoped design; page
geometry comes from the active design rather than shell constants. Safari
Editorial and Minimal Grid validate the registry boundary, with Minimal Grid
remaining a preview contract fixture rather than a finished visual template.

- Introduce a versioned design definition containing identity, preview image,
  page dimensions, brand tokens, supported sections, approved variants,
  defaults, renderers, and editor schemas.
- Remove Tanzania-specific assumptions from the editor shell and page metadata.
- Add a design selector within the proposal workflow, not an admin dashboard.
- Define compatible design switching, warnings for unsupported content, and a
  safe rollback path.
- Validate the contract with the existing reference design and a second minimal
  design fixture before building another complete proposal template.

### Phase 3.4 — Editor implementation pass

- Implement the approved editor layout and interaction states.
- Make page navigation, inspector rendering, and canvas behavior consume the
  design-neutral contracts.
- Add focused visual and interaction tests for the shell at representative
  viewport sizes.
- Review the result as an editor product, independently from the visual quality
  of the Tanzania document itself.

### Acceptance criteria

- The same editor shell can load two design definitions without conditional
  template-specific UI branches.
- Users can identify the active document design and understand where to change
  it.
- Pages, canvas, and Properties remain the clear primary hierarchy on desktop
  and smaller screens.
- Design-specific controls appear contextually without leaking into global
  editor navigation.
- Switching to an incompatible design cannot silently discard content.
- The editor passes keyboard, responsive, and visual-regression checks for its
  primary states.

## Phase 4 — Travel-native itinerary editor

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

## Phase 5 — Contextual catalog

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

## Phase 6 — Document composition

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

## Phase 7 — Reliable PDF generation

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

## Phase 8 — Client proposal experience

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

## Phase 9 — Brand fidelity, quality, and deployment

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
- [x] Phase 2 — persistent structured editing and complete form coverage.
- [ ] Phase 3 — editor design and multi-design foundation (current priority).
- [ ] Phase 4 — itinerary editor.
- [ ] Phase 5 — contextual catalog.
- [ ] Phase 6 — document composition.
- [ ] Phase 7 — PDF generation workflow.
- [ ] Phase 8 — client proposal experience.
- [ ] Phase 9 — brand, testing, and deployment readiness.
