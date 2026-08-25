import Database from "better-sqlite3";
import { cp, mkdir, rename, stat } from "node:fs/promises";
import path from "node:path";

const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="))?.slice(9);
const confirmed = process.argv.includes("--confirm");
if (!sourceArgument || !confirmed) {
  throw new Error("Usage: npm run db:restore -- --source=<backup.db> --confirm");
}

const source = path.resolve(sourceArgument);
const destination = path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db");
const sourceUploads = `${source}.uploads`;
const destinationUploads = path.resolve(process.env.LIBRARY_UPLOAD_DIRECTORY ?? path.join(path.dirname(destination), "uploads"));
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

let stagedUploads;
try {
  await stat(sourceUploads);
  stagedUploads = `${destinationUploads}.restore-staging-${Date.now()}`;
  await cp(sourceUploads, stagedUploads, { recursive: true, errorOnExist: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
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

let uploadRecoveryPath;
if (stagedUploads) {
  await mkdir(path.dirname(destinationUploads), { recursive: true });
  try {
    await stat(destinationUploads);
    uploadRecoveryPath = `${destinationUploads}.before-restore-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`;
    await rename(destinationUploads, uploadRecoveryPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  try {
    await rename(stagedUploads, destinationUploads);
  } catch (error) {
    if (uploadRecoveryPath) await rename(uploadRecoveryPath, destinationUploads);
    throw error;
  }
}

console.info(JSON.stringify({ event: "database_restore_completed", source, destination, recoveryPath, sourceUploads: stagedUploads ? sourceUploads : null, destinationUploads: stagedUploads ? destinationUploads : null, uploadRecoveryPath }));
