"use client";

import { CircleAlert, Download, LoaderCircle, RotateCw } from "lucide-react";
import { useState } from "react";

import { EditorButton } from "./EditorUi";

type PdfState = "idle" | "generating" | "success" | "error";

export default function PdfGenerateButton({ proposalId, disabled }: { proposalId: number; disabled?: boolean }) {
  const [state, setState] = useState<PdfState>("idle");
  const [error, setError] = useState("");

  async function generate() {
    setState("generating");
    setError("");
    try {
      const response = await fetch(`/api/proposals/${proposalId}/pdf`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? "The PDF could not be generated.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `proposal-${proposalId}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setState("success");
      window.setTimeout(() => setState("idle"), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The PDF could not be generated.");
      setState("error");
    }
  }

  return (
    <EditorButton
      type="button"
      variant="primary"
      disabled={disabled || state === "generating"}
      onClick={() => void generate()}
      aria-label={error || "Generate and download PDF"}
      title={error || (disabled ? "Save the proposal before generating" : "Generate PDF")}
    >
      {state === "generating" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        : state === "error" ? <CircleAlert className="size-4" aria-hidden="true" />
          : state === "success" ? <Download className="size-4" aria-hidden="true" />
            : <Download className="size-4" aria-hidden="true" />}
      <span className="hidden xl:inline">
        {state === "generating" ? "Generating…" : state === "error" ? <><RotateCw className="mr-1 inline size-3.5" /> Retry PDF</> : state === "success" ? "Downloaded" : "Generate PDF"}
      </span>
    </EditorButton>
  );
}
