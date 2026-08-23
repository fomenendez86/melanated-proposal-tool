# Proposal Studio — Reliable PDF Generation

**Status:** Phase 7 implemented and smoke-tested  
**Updated:** 2026-08-21

## Runtime flow

`GET /api/proposals/[id]/pdf` validates the proposal, resolves its active
versioned design, opens the saved client preview in headless Chromium, waits for
network, fonts, and images, and returns an in-memory PDF download. No manually
started render script or shared output filename is required.

The editor's Generate PDF action exposes idle, generating, success, failure,
and retry states. It is disabled while proposal edits are dirty, saving, or in
an error state, so output always uses canonical saved data.

## Reliability decisions

- Each response filename includes proposal number, title, and millisecond UTC
  timestamp.
- PDF bytes remain request-local; concurrent requests cannot overwrite a shared
  server file.
- Page width and height come from the active design contract.
- Responses are `no-store` and use download-safe filename sanitization.
- Success/failure metadata is recorded as a `proposal_events` row
  (`type: "pdf_generated"` / `"pdf_failed"`, `lib/db/schema.ts`), including
  duration, byte length, design identity, and bounded error detail — write-only,
  nothing reads it back yet (promoted from a proposal-scoped virtual
  `proposal_sections` row in Fase 12.1; same fields, real table now).
- Metadata failure never prevents delivery of an otherwise valid PDF.
- Chromium closes in a `finally` block on success or failure.

## Deployment boundary

Generation is synchronous because the measured local fixture completes within
the route's 60-second budget. Before production hosting, verify that the chosen
runtime supports Playwright/Chromium and measure cold-start plus large-proposal
times. Move to a queue and object storage if those measurements exceed platform
limits; the editor state model does not need to change.

## Verification evidence

The proposal 1 smoke test returned HTTP 200, `application/pdf`, an attachment
filename unique to the request, a 32-page response header, and 6,073,864 bytes.
Independent PDF inspection confirmed:

- PDF 1.4 produced by Chromium/Skia;
- 32 US Letter pages at 612x792 points;
- extractable text on all pages (34 in the current seed proposal);
- rendered cover, middle itinerary page, and closing page with backgrounds and
  imagery present.

The render also exposed an existing cover-copy wrap defect (a lone final letter
in the narrow subtitle column). That is tracked for Phase 9 visual fidelity and
does not affect generation integrity.
