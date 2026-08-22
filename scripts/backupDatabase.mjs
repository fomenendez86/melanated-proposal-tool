import Database from "better-sqlite3";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const databasePath = path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db");
const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY ?? "./backups");
const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const destination = path.join(backupDirectory, `proposals-${timestamp}.db`);

await stat(databasePath);
await mkdir(backupDirectory, { recursive: true });

const database = new Database(databasePath, { readonly: true, fileMustExist: true });
try {
  const integrity = database.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") throw new Error(`Source database failed integrity check: ${integrity}`);
  await database.backup(destination);
} finally {
  database.close();
}

const verification = new Database(destination, { readonly: true, fileMustExist: true });
try {
  const integrity = verification.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") throw new Error(`Backup failed integrity check: ${integrity}`);
} finally {
  verification.close();
}

console.info(JSON.stringify({ event: "database_backup_completed", source: databasePath, destination }));
