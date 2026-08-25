import { cookies } from "next/headers";
import { chromium } from "playwright";

import { db } from "@/lib/db/client";
import { getSharedProposal, isSharedProposalExpired, shareCookieName } from "@/lib/db/getSharedProposal";
import { proposalEvents } from "@/lib/db/schema";

export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const record = await getSharedProposal(token); if (!record) return Response.json({ error: "Shared proposal not found." }, { status: 404 });
  if (isSharedProposalExpired(record.share.expiresAt)) return Response.json({ error: "This proposal has expired." }, { status: 410 });
  if (record.share.accessKey) { const cookieStore = await cookies(); if (cookieStore.get(shareCookieName(token))?.value !== record.share.accessKey) return Response.json({ error: "Unlock this proposal first." }, { status: 401 }); }
  const printUrl = new URL(`/share/${token}/print`, request.url); let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: record.revision.design.page.widthPx, height: record.revision.design.page.heightPx } });
    if (record.share.accessKey) await page.context().addCookies([{ name: shareCookieName(token), value: record.share.accessKey, domain: printUrl.hostname, path: `/share/${token}`, httpOnly: true, secure: printUrl.protocol === "https:", sameSite: "Strict" }]);
    await page.goto(printUrl.toString(), { waitUntil: "networkidle", timeout: 45_000 }); await page.emulateMedia({ media: "print" }); await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); }))); });
    const pdf = await page.pdf({ width: `${record.revision.design.page.widthPx}px`, height: `${record.revision.design.page.heightPx}px`, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
    await db.insert(proposalEvents).values({ proposalId: record.share.proposalId, shareId: record.share.id, type: "pdf_downloaded", metadata: { signed: Boolean(record.revision.sealedAt), byteLength: pdf.byteLength } });
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="proposal-${record.share.proposalId}-revision-${record.revision.id}.pdf"`, "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "The signed PDF could not be generated." }, { status: 500 }); } finally { await browser?.close(); }
}
