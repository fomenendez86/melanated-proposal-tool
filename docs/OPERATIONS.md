# Production operations

## Deployment decision

Run one Node.js application instance (directly or in the included Docker image)
with a durable volume mounted at `/app/data`. Set `DATABASE_URL` to an absolute
path on that volume. This preserves SQLite and supports local Chromium PDF
generation. Ephemeral/serverless filesystems are intentionally unsupported.

For horizontal scaling, migrate transactional storage away from SQLite first;
do not mount one SQLite file concurrently into multiple application instances.

## Access

Set `STUDIO_AUTH_PASSWORD` (the single shared login credential) and
`STUDIO_SESSION_SECRET` (a random secret — e.g. `openssl rand -hex 32` —
used to sign the session cookie) in the hosting platform's environment.
Neither has a default; the app throws if either is missing when needed,
rather than silently running unprotected. Rotate `STUDIO_SESSION_SECRET` to
invalidate every existing session immediately (e.g. after an incident);
rotate `STUDIO_AUTH_PASSWORD` for routine credential hygiene. Login and the
share-password endpoint both rate-limit by client IP (5 attempts / 15
minutes, in-memory — resets on process restart); this assumes the app runs
behind a reverse proxy that sets `X-Forwarded-For`, otherwise every client
shares one bucket. `/share/[token]` is unaffected — it has its own,
separate per-share password protection that predates this.

## Start and health

`npm run start:production` creates the database directory, applies committed
Drizzle migrations, and starts Next.js. `GET /api/health` returns `200` only
when the process can query the database. The container health check calls it
every 30 seconds.

Operational events are emitted as one-line JSON. Capture stdout/stderr in the
hosting platform and alert on HTTP 5xx responses, `health_check_failed`, failed
PDF generation records, disk usage above 80%, and backup age over 24 hours.

## Backups

Run `npm run db:backup` at least daily. It uses SQLite's online backup API and
verifies both source and destination with `PRAGMA integrity_check`. When the
image library has files, it also copies the uploads volume next to the database
as `<backup.db>.uploads`; keep both paths together. Set `BACKUP_DIRECTORY` to
durable storage or copy the resulting pair off-host. Retain 7 daily, 4 weekly,
and 6 monthly copies. Encrypt off-host copies.

The current image-storage adapter is filesystem-backed and selected through
`LIBRARY_UPLOAD_DIRECTORY` (otherwise it uses `uploads/` beside the SQLite
database). The database stores a content-hash key and public application URL,
not an absolute filesystem path. Production object storage is intentionally a
deployment decision to revisit: replacing this adapter with S3-compatible
storage must preserve those stable keys and the library API contract. Until
then, production requires a durable volume and the paired database/uploads
backup described above.

## Scheduled checks

Run `npm run notifications:check-expiring` every 4-6 hours via an external
scheduler (Windows Task Scheduler on this dev machine; cron or a systemd timer
in a Linux deployment) — there is no in-process scheduler anywhere in this
codebase (`scripts/startProduction.mjs` only runs migrations and starts Next).
It's safe to run at any frequency: the underlying notification primitive
dedupes by key, so re-running never sends a duplicate. The dashboard
(`/proposals`) also calls the same check on every page load as a free
near-real-time supplement between scheduled runs; that call stays in place and
is not a substitute for the scheduled job, since a share expiring while nobody
opens the dashboard would otherwise never notify.

## Recovery

1. Stop the application so no writes occur.
2. Select a verified `.db` backup.
3. Run `npm run db:restore -- --source=<absolute-or-relative-backup.db> --confirm`.
4. The script integrity-checks the backup and renames the current database to a
   timestamped `before-restore` recovery file before restoring. If the sibling
   `<backup.db>.uploads` directory exists, it stages and swaps that directory
   too, preserving the previous uploads as a timestamped recovery directory.
5. Start the application, call `/api/health`, open a proposal, and generate a
   PDF smoke test.

Test recovery in staging quarterly. Never restore directly over a running
application.

## Brand assets

The repository currently contains the approved page-reference renders and the
derived zebra cover image, but it does not contain a complete approved source
pack for the logo, fonts, founder photography, hotel photography, excursions,
icons, or illustrations. Picsum URLs remain visibly detectable placeholders.
Replace them only from an owner-approved asset pack, preserving image credits
and usage rights; do not infer approval from the reference screenshots.

## Email and electronic-signature scope

Development email delivery writes RFC-style `.eml` files to `data/outbox`
(override with `EMAIL_OUTBOX_DIRECTORY`). Production sends only when
`EMAIL_PROVIDER=webhook` and `EMAIL_WEBHOOK_URL` are explicitly configured;
otherwise the Send dialog returns a copyable share link and no client data is
transmitted. Set `PUBLIC_APP_URL` to the public origin used inside messages.

The built-in signature flow is a simple electronic signature with evidence:
typed or drawn mark, signer name/email/role, timestamp, truncated IP, user
agent, and a SHA-256 hash of the immutable revision payload. It is not a
qualified signature or a substitute for a certified trust-service provider.
