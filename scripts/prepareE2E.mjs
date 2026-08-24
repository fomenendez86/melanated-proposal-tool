import Database from "better-sqlite3";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const databasePath = path.resolve("data/e2e-proposals.db");
const databaseFiles = [databasePath, `${databasePath}-shm`, `${databasePath}-wal`];
const distDirPath = path.resolve(".next-e2e");
const env = {
  ...process.env,
  DATABASE_URL: databasePath,
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.resolve("tests/fixtures/google-fonts.cjs"),
};

mkdirSync(path.dirname(databasePath), { recursive: true });
for (const file of databaseFiles) rmSync(file, { force: true });
rmSync(distDirPath, { recursive: true, force: true });

const sqlite = new Database(databasePath);
try {
  sqlite.pragma("journal_mode = WAL");
  migrate(drizzle(sqlite), { migrationsFolder: path.resolve("lib/db/migrations") });
} finally {
  sqlite.close();
}

const seed = spawnSync(process.execPath, ["--import", "./tests/tsx-bootstrap.mjs", "lib/db/seed.ts"], {
  stdio: "inherit",
  env,
});
if (seed.status !== 0) process.exit(seed.status ?? 1);
