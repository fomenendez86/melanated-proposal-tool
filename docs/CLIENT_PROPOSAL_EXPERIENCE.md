# Proposal Studio — Client Proposal Experience

**Status:** Phase 8 implemented and integration-tested; storage promoted to
real tables in Fase 12.1  
**Updated:** 2026-08-23

## Immutable sharing

Creating a share link snapshots the saved `ProposalData` and active versioned
design into a `proposal_revisions` row (`lib/db/schema.ts`). The public token
points to that revision, not the mutable editor. Later catalog, layout, or
content changes therefore cannot silently alter what the client reviewed.

`proposal_shares` holds a cryptographically random 48-character token (unique
column, indexed — token lookups are a direct query, not a scan), expiration,
a `revisionId` foreign key, and optional password material. Passwords use
scrypt with a unique salt; successful unlock writes a scoped HttpOnly,
SameSite=Strict access cookie. The cookie is Secure whenever the request uses
HTTPS. `proposal_shares.revokedAt` exists as a column and is already honored
on read (a revoked share resolves like an unknown token) but there is no UI
to set it yet — that lands with the Fase 12.2 dashboard.

Fase 12.1 also replaced the `documentDesign`, `proposalRevision`,
`shareSettings`, `proposalLifecycleEvent`, `proposalApproval`, and
`pdfGeneration` virtual `proposal_sections` rows this document used to
describe with real columns/tables — see `lib/db/schema.ts` and
`docs/DOCUMENT_DESIGN_CONTRACT.md`. Behavior for a client viewing or
approving a proposal is unchanged; only the storage moved.

## Client view

`/share/[token]` provides a clean branded header, responsive page scaling,
document pages without editor chrome, expiration guidance, and approval form.
Approval records name, optional validated email, and timestamp in
`proposal_events` (`type: "approved"`), tied to the share by a real foreign
key. The lifecycle records `shared`, `opened`, and `approved` events the same
way, and each one also advances `proposals.status` forward
(`draft → sent → viewed → approved`, never backward, never overriding a
manually-set `lost`/`archived`) — the manual transitions and the dashboard UI
to trigger them are Fase 12.2.

Comparisons remain optional by product definition and are not shown when the
revision contains a single selected package.

## Editor workflow

Share is disabled while the editor is dirty, saving, or failed. The share dialog
configures 7/30/90/365-day expiration and an optional password, then provides a
copyable URL and direct open action.

## Integration evidence

Automated by `tests/http.integration.test.mjs` (`npm run test:integration`,
against a running dev server) — re-run and passing after the Fase 12.1
storage migration:

- Public share creation returned a 48-character token.
- The immutable route returned HTTP 200 with full proposal content.
- Approval was recorded successfully against the revision.
- A protected share rendered the password gate.
- Incorrect password returned HTTP 401.
- Correct password set access and revealed the proposal.
- Lint, TypeScript, and production build cover all share/API routes.

## Deployment boundary

The current application is intentionally single-user and has no advisor
authentication. Production deployment must protect editor and proposal-creation
APIs behind authenticated authorization. Public share tokens, password checks,
expiration, and approval validation are already enforced independently.
