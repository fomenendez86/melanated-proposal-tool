import { createHash } from "node:crypto";

import type { proposalRevisions } from "@/lib/db/schema";

export function revisionPayloadHash(revision: typeof proposalRevisions.$inferSelect) {
  return createHash("sha256").update(JSON.stringify({ id: revision.id, proposalId: revision.proposalId, designId: revision.designId, designVersion: revision.designVersion, data: revision.data, design: revision.design })).digest("hex");
}

export function truncateIpAddress(value: string | null) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim() ?? "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(first)) return first.split(".").map((part, index) => index === 3 ? "0" : part).join(".");
  if (first.includes(":")) return `${first.split(":").slice(0, 4).join(":")}::`;
  return null;
}
