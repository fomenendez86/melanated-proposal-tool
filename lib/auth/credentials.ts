import { timingSafeEqual } from "node:crypto";

export function verifyLoginPassword(candidate: string): boolean {
  const expected = process.env.STUDIO_AUTH_PASSWORD;
  if (!expected) throw new Error("STUDIO_AUTH_PASSWORD is not set.");
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  if (candidateBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(candidateBuffer, expectedBuffer);
}
