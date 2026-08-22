import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const databasePath = path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db");
mkdirSync(path.dirname(databasePath), { recursive: true });
const sqlite = new Database(databasePath);
try {
  sqlite.pragma("journal_mode = WAL");
  migrate(drizzle(sqlite), { migrationsFolder: path.resolve("lib/db/migrations") });
} finally {
  sqlite.close();
}

const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start"], {
  stdio: "inherit",
  env: process.env,
});
next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
