import { sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    db.get(sql`select 1 as healthy`);
    return Response.json(
      { status: "ok", database: "reachable", checkedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logEvent("error", "health_check_failed", {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    return Response.json(
      { status: "error", database: "unreachable", checkedAt: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
