# Production operations

## Deployment decision

Run one Node.js application instance (directly or in the included Docker image)
with a durable volume mounted at `/app/data`. Set `DATABASE_URL` to an absolute
path on that volume. This preserves SQLite and supports local Chromium PDF
generation. Ephemeral/serverless filesystems are intentionally unsupported.

For horizontal scaling, migrate transactional storage away from SQLite first;
do not mount one SQLite file concurrently into multiple application instances.

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
verifies both source and destination with `PRAGMA integrity_check`. Set
`BACKUP_DIRECTORY` to durable storage or copy the resulting file off-host.
Retain 7 daily, 4 weekly, and 6 monthly copies. Encrypt off-host copies.

## Recovery

1. Stop the application so no writes occur.
2. Select a verified `.db` backup.
3. Run `npm run db:restore -- --source=<absolute-or-relative-backup.db> --confirm`.
4. The script integrity-checks the backup and renames the current database to a
   timestamped `before-restore` recovery file before restoring.
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
