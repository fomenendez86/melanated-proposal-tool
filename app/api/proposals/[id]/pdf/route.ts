import { chromium } from "playwright";

import { db } from "@/lib/db/client";
import { getProposalData } from "@/lib/db/getProposalData";
import { getProposalDesignContext } from "@/lib/db/getProposalDesignContext";
import { getProposalSummary } from "@/lib/db/getProposalSummary";
import { proposalEvents } from "@/lib/db/schema";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeFilenamePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "proposal";
}

async function recordGeneration(
  proposalId: number,
  status: "success" | "failed",
  metadata: Record<string, unknown>
) {
  try {
    await db.insert(proposalEvents).values({
      proposalId,
      type: status === "success" ? "pdf_generated" : "pdf_failed",
      metadata,
    });
  } catch {
    // Generation metadata must never prevent delivery of a valid PDF response.
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId < 1) {
    return Response.json({ error: "Invalid proposal id." }, { status: 400 });
  }

  const summary = await getProposalSummary(proposalId);
  if (!summary) return Response.json({ error: "Proposal not found." }, { status: 404 });

  const data = await getProposalData(proposalId);
  const design = await getProposalDesignContext(proposalId, data.sections.map((section) => section.type));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${safeFilenamePart(summary.proposalNumber)}-${safeFilenamePart(summary.title)}-${timestamp}.pdf`;
  const previewUrl = new URL(`/proposals/${proposalId}/preview?pdf=1`, request.url).toString();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: design.active.page.widthPx, height: design.active.page.heightPx },
    });
    await page.goto(previewUrl, { waitUntil: "networkidle", timeout: 45_000 });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }))
      );
    });
    const overflowPages = await page.locator("[data-proposal-page]").evaluateAll((pageNodes) =>
      pageNodes.flatMap((pageNode, index) => {
        const section = pageNode.firstElementChild;
        if (!(section instanceof HTMLElement)) return [];
        const pageBounds = section.getBoundingClientRect();
        const overflows = Array.from(section.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, table")).some((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.bottom > pageBounds.bottom + 1 || bounds.right > pageBounds.right + 1 || bounds.top < pageBounds.top - 1 || bounds.left < pageBounds.left - 1;
        });
        return overflows ? [index + 1] : [];
      })
    );
    const pdf = await page.pdf({
      width: `${design.active.page.widthPx}px`,
      height: `${design.active.page.heightPx}px`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await recordGeneration(proposalId, "success", {
      filename,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      byteLength: pdf.byteLength,
      designId: design.active.id,
      designVersion: design.active.version,
      overflowPages,
    });
    logEvent("info", "pdf_generation_completed", {
      proposalId,
      durationMs: Date.now() - startedAt,
      byteLength: pdf.byteLength,
      pageCount: data.sections.length,
      overflowPages,
      designId: design.active.id,
      designVersion: design.active.version,
    });
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Proposal-Pages": String(data.sections.length),
        "X-Proposal-Overflow-Pages": overflowPages.join(","),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF generation error.";
    await recordGeneration(proposalId, "failed", {
      filename,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      error: message.slice(0, 1000),
      designId: design.active.id,
      designVersion: design.active.version,
    });
    logEvent("error", "pdf_generation_failed", {
      proposalId,
      durationMs: Date.now() - startedAt,
      error: message.slice(0, 1000),
      designId: design.active.id,
      designVersion: design.active.version,
    });
    return Response.json(
      { error: "The PDF could not be generated. Check the saved proposal and try again." },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}
