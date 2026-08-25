import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_LIBRARY_IMAGE_BYTES = 8 * 1024 * 1024;

function databaseDirectory() {
  return path.dirname(path.resolve(process.env.DATABASE_URL ?? "./data/proposals.db"));
}

export function libraryUploadDirectory() {
  return path.resolve(process.env.LIBRARY_UPLOAD_DIRECTORY ?? path.join(databaseDirectory(), "uploads"));
}

function detectedImageType(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { extension: "png", mimeType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { extension: "webp", mimeType: "image/webp" };
  }
  if (bytes.length >= 6) {
    const signature = String.fromCharCode(...bytes.slice(0, 6));
    if (signature === "GIF87a" || signature === "GIF89a") return { extension: "gif", mimeType: "image/gif" };
  }
  return null;
}

export async function storeLibraryImage(file: File) {
  if (file.size < 1 || file.size > MAX_LIBRARY_IMAGE_BYTES) {
    throw new Error("Images must be between 1 byte and 8 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectedImageType(bytes);
  if (!type) throw new Error("Upload a PNG, JPEG, WebP, or GIF image.");
  const hash = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `${hash}.${type.extension}`;
  const directory = libraryUploadDirectory();
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(path.join(directory, storageKey), bytes, { flag: "wx" });
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
  }
  return { storageKey, mimeType: type.mimeType, sizeBytes: bytes.byteLength };
}

export async function readLibraryImage(storageKey: string) {
  if (!/^[a-f0-9]{64}\.(png|jpg|webp|gif)$/.test(storageKey)) return null;
  try {
    return await readFile(path.join(libraryUploadDirectory(), storageKey));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}
