import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "studio_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const secret = process.env.STUDIO_SESSION_SECRET;
  if (!secret) throw new Error("STUDIO_SESSION_SECRET is not set.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + maxAgeSeconds * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Pure — safe to call from proxy.ts (NextRequest cookies) and from
// Server Actions/Route Handlers alike.
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex < 0) return false;
  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  if (!payload || !signature) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(sign(payload), "hex");
    actual = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp: unknown };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function hasValidSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}
