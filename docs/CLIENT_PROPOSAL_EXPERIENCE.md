# Proposal Studio — Client Proposal Experience

**Status:** Phase 8 implemented and integration-tested  
**Updated:** 2026-08-21

## Immutable sharing

Creating a share link snapshots the saved `ProposalData` and active versioned
design into a proposal revision. The public token points to that revision, not
the mutable editor. Later catalog, layout, or content changes therefore cannot
silently alter what the client reviewed.

Share settings contain a cryptographically random 48-character token,
expiration, revision reference, and optional password material. Passwords use
scrypt with a unique salt; successful unlock writes a scoped HttpOnly,
SameSite=Strict access cookie. The cookie is Secure whenever the request uses
HTTPS.

## Client view

`/share/[token]` provides a clean branded header, responsive page scaling,
document pages without editor chrome, expiration guidance, and approval form.
Approval records name, optional validated email, timestamp, token, and exact
revision ID. The lifecycle records shared, opened, and approved events.

Comparisons remain optional by product definition and are not shown when the
revision contains a single selected package.

## Editor workflow

Share is disabled while the editor is dirty, saving, or failed. The share dialog
configures 7/30/90/365-day expiration and an optional password, then provides a
copyable URL and direct open action.

## Integration evidence

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
