import Database from "better-sqlite3";
import { mkdir, rename, stat } from "node:fs/promises";
import path from "node:path";

const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))?.slice(9);
const confirmed = process.argv.includes("--confirm");
if (!sourceArgument || !confirmed) {
  throw new Error("Usage: npm run db:restore -- --source=<backup.db> --confirm");
}

const source = path.resolve(sourceArgument);
const destination = path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db");
if (source === destination) throw new Error("Backup source and database destination must be different files.");
if (path.extname(source).toLowerCase() !== ".db" || path.extname(destination).toLowerCase() !== ".db") {
  throw new Error("Source and destination must be explicit .db files.");
}

await stat(source);
await mkdir(path.dirname(destination), { recursive: true });
const sourceDatabase = new Database(source, { readonly: true, fileMustExist: true });
const integrity = sourceDatabase.pragma("integrity_check", { simple: true });
if (integrity !== "ok") {
  sourceDatabase.close();
  throw new Error(`Backup failed integrity check: ${integrity}`);
}

let recoveryPath;
try {
  await stat(destination);
  recoveryPath = `${destination}.before-restore-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
  await rename(destination, recoveryPath);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

try {
  await sourceDatabase.backup(destination);
} catch (error) {
  if (recoveryPath) await rename(recoveryPath, destination);
  throw error;
} finally {
  sourceDatabase.close();
}

console.info(JSON.stringify({ event: "database_restore_completed", source, destination, recoveryPath }));
