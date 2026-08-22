# Melanated Safaris Proposal Studio

A visual, multi-design proposal editor for assembling travel itineraries,
accommodations, excursions, pricing, terms, client revisions, and print-ready
PDFs from structured data.

## Local development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000/proposals/1/editor`.

## Verification

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

The integration and E2E suites expect the development server on port 3000;
Playwright starts one automatically when the port is free.

## Production

The supported initial topology is a single Node/Docker instance with a durable
SQLite volume. See `docs/OPERATIONS.md` for deployment, health checks, backups,
restore, monitoring, and recovery testing.

## Roadmap and contracts

Start with `CLAUDE.md` and `docs/EDITOR_IMPLEMENTATION_PLAN.md`. Phase-specific
contracts live in `docs/`, including the multi-design, catalog, composition,
PDF, client sharing, and Phase 9 quality documentation.
