import "server-only";

import { createProviderRequestSignature, formatProviderRequestDate } from "./auth";
import { getActivityProviderConfig } from "./config";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function providerFetch(pathname: string, query: Record<string, string> = {}): Promise<unknown> {
  const config = getActivityProviderConfig();
  const url = new URL(pathname, `${config.baseUrl}/`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const signedPath = `${url.pathname}${url.search}`;
  const date = formatProviderRequestDate(new Date());
  const signature = createProviderRequestSignature({
    date,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    method: "GET",
    path: signedPath,
  });

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      [`X-${config.headerPrefix}-Date`]: date,
      [`X-${config.headerPrefix}-AccessKey`]: config.accessKey,
      [`X-${config.headerPrefix}-Signature`]: signature,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new Error(`Activity provider request failed (${response.status})${retryAfter ? `; retry after ${retryAfter}s` : ""}.`);
  }
  return response.json();
}

export async function getActiveProviderProductIds(): Promise<string[]> {
  const payload = asRecord(await providerFetch("/activity.json/active-ids"));
  const suppliers = Array.isArray(payload?.suppliers) ? payload.suppliers : [];
  const ids = suppliers.flatMap((supplier) => {
    const record = asRecord(supplier);
    return Array.isArray(record?.activityIds) ? record.activityIds : [];
  });
  return [...new Set(ids.map(String).filter((id) => /^\d+$/.test(id)))];
}

export async function getProviderActivity(productId: string): Promise<unknown> {
  const config = getActivityProviderConfig();
  return providerFetch(`/activity.json/${encodeURIComponent(productId)}`, {
    currency: config.currency,
    lang: config.language,
  });
}

export async function getProviderActivityPlaces(productId: string): Promise<unknown> {
  const config = getActivityProviderConfig();
  return providerFetch(`/activity.json/${encodeURIComponent(productId)}/pickup-places`, {
    currency: config.currency,
    lang: config.language,
  });
}
