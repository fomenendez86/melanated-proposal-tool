// In-memory, per-process rate limiter — matches this app's single-Node-
// instance deployment (see docs/OPERATIONS.md). Resets on server restart;
// "basico" per the Fase 12.3 spec, not a distributed limiter.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; firstAttemptAt: number }>();

function currentEntry(key: string) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAttemptAt > WINDOW_MS) return undefined;
  return entry;
}

export function isRateLimited(key: string): boolean {
  const entry = currentEntry(key);
  return entry != null && entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const entry = currentEntry(key);
  if (entry) {
    entry.count += 1;
    return;
  }
  attempts.set(key, { count: 1, firstAttemptAt: Date.now() });
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

// `scope` namespaces the bucket (e.g. "login" vs "share-unlock") so
// exhausting one doesn't lock a caller out of the other unrelated flow —
// both happen to key by the same client IP otherwise.
export function rateLimitKeyFromHeaders(headers: Headers, scope: string): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return `${scope}:${ip || "unknown"}`;
}
