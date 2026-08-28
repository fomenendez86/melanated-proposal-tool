import "server-only";

export interface ActivityProviderConfig {
  baseUrl: string;
  accessKey: string;
  secretKey: string;
  headerPrefix: string;
  language: string;
  currency: string;
}

const REQUIRED_KEYS = [
  "ACTIVITY_PROVIDER_BASE_URL",
  "ACTIVITY_PROVIDER_ACCESS_KEY",
  "ACTIVITY_PROVIDER_SECRET_KEY",
  "ACTIVITY_PROVIDER_HEADER_PREFIX",
] as const;

export function isActivityProviderConfigured(): boolean {
  return REQUIRED_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function getActivityProviderConfig(): ActivityProviderConfig {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Activity provider is not configured. Missing: ${missing.join(", ")}.`);
  }

  const baseUrl = process.env.ACTIVITY_PROVIDER_BASE_URL!.trim().replace(/\/$/, "");
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:") throw new Error("Activity provider URL must use HTTPS.");

  const headerPrefix = process.env.ACTIVITY_PROVIDER_HEADER_PREFIX!.trim();
  if (!/^[A-Za-z0-9-]{2,40}$/.test(headerPrefix)) {
    throw new Error("Activity provider header prefix is invalid.");
  }

  return {
    baseUrl,
    accessKey: process.env.ACTIVITY_PROVIDER_ACCESS_KEY!.trim(),
    secretKey: process.env.ACTIVITY_PROVIDER_SECRET_KEY!.trim(),
    headerPrefix,
    language: process.env.ACTIVITY_PROVIDER_LANGUAGE?.trim().toUpperCase() || "EN",
    currency: process.env.ACTIVITY_PROVIDER_CURRENCY?.trim().toUpperCase() || "USD",
  };
}
