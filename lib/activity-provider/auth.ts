import { createHmac } from "node:crypto";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatProviderRequestDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function createProviderRequestSignature({
  date,
  accessKey,
  secretKey,
  method,
  path,
}: {
  date: string;
  accessKey: string;
  secretKey: string;
  method: string;
  path: string;
}): string {
  const input = `${date}${accessKey}${method.toUpperCase()}${path}`;
  return createHmac("sha1", secretKey).update(input, "utf8").digest("base64");
}
