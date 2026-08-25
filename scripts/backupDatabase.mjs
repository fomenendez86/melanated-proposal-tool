import Database from "better-sqlite3";
import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const databasePath = path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db");
const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY ?? "./backups");
const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const destination = path.join(backupDirectory, `proposals-${timestamp}.db`);
const uploadDirectory = path.resolve(process.env.LIBRARY_UPLOAD_DIRECTORY ?? path.join(path.dirname(databasePath), "uploads"));
const uploadDestination = `${destination}.uploads`;

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

let uploadsBackedUp = false;
try {
  await stat(uploadDirectory);
  await cp(uploadDirectory, uploadDestination, { recursive: true, errorOnExist: true });
  uploadsBackedUp = true;
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.info(JSON.stringify({ event: "database_backup_completed", source: databasePath, destination, uploadDirectory, uploadDestination: uploadsBackedUp ? uploadDestination : null }));
