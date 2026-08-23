"use client";

import { Archive, ArchiveRestore, Copy, Eye, FileEdit, LogOut, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { logout } from "@/app/login/actions";
import { archiveProposal, deleteProposal, duplicateProposalFromDashboard, restoreProposal } from "@/app/proposals/actions";
import { EditorButton, EditorEmptyState, EditorStatusBadge, editorButtonStyles, editorFocusRing } from "@/components/editor/EditorUi";
import type { ClientOption } from "@/lib/db/getClientOptions";
import type { ProposalListRow } from "@/lib/db/getProposalList";
import type { ProposalStatus } from "@/lib/db/proposalStatus";
import type { DocumentDesignDescriptor } from "@/lib/designs/types";

import CreateProposalDialog from "./CreateProposalDialog";

const STATUS_OPTIONS: { value: ProposalStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "approved", label: "Approved" },
  { value: "lost", label: "Lost" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONE: Record<ProposalStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  sent: "neutral",
  viewed: "warning",
  approved: "success",
  lost: "danger",
  archived: "neutral",
};

type SortMode = "activity" | "value" | "name";

const selectClass = `h-11 rounded-lg border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`;

export default function ProposalDashboard({
  rows,
  clients,
  designs,
}: {
  rows: ProposalListRow[];
  clients: ClientOption[];
  designs: DocumentDesignDescriptor[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("activity");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!query) return true;
      return (
        row.title.toLowerCase().includes(query) ||
        row.clientName.toLowerCase().includes(query) ||
        row.proposalNumber.toLowerCase().includes(query)
      );
    });
    const sorted = [...filtered];
    if (sortMode === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === "value") {
      sorted.sort((a, b) => (b.valueRaw ?? -1) - (a.valueRaw ?? -1));
    } else {
      sorted.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
    }
    return sorted;
  }, [rows, search, statusFilter, sortMode]);

  async function runAction(id: number, action: () => Promise<{ ok: boolean; formError?: string; id?: number }>) {
    setError("");
    setPendingId(id);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(result.formError ?? "That action could not be completed.");
      return;
    }
    router.refresh();
    return result;
  }

  async function handleDuplicate(id: number) {
    const result = await runAction(id, () => duplicateProposalFromDashboard(id));
    if (result?.ok && result.id) router.push(`/proposals/${result.id}/editor`);
  }

  function handleDelete(id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    void runAction(id, () => deleteProposal(id));
  }

  const existingProposals = rows.map((row) => ({ id: row.id, title: row.title }));

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-editor-text-strong">Proposals</h1>
          <p className="mt-1 text-sm text-editor-text-muted">{rows.length} proposal{rows.length === 1 ? "" : "s"} total</p>
        </div>
        <div className="flex items-center gap-2">
          <CreateProposalDialog clients={clients} designs={designs} existingProposals={existingProposals} />
          <form action={logout}>
            <EditorButton type="submit" variant="ghost" aria-label="Log out">
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </EditorButton>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-editor-text-subtle" aria-hidden="true" />
          <input
            aria-label="Search proposals"
            placeholder="Search by name, client, or number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`h-11 w-full rounded-lg border border-editor-border bg-editor-raised pl-9 pr-3 text-sm ${editorFocusRing}`}
          />
        </div>
        <select aria-label="Filter by status" className={selectClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "all")}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select aria-label="Sort proposals" className={selectClass} value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="activity">Sort: Last activity</option>
          <option value="value">Sort: Value</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {error ? <p className="text-sm font-semibold text-editor-danger">{error}</p> : null}

      {visibleRows.length === 0 ? (
        <EditorEmptyState title="No proposals match" description="Try a different search or status filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-editor-border-subtle">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-editor-border-subtle bg-editor-panel-muted text-left text-xs font-bold uppercase tracking-[0.08em] text-editor-text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Design</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-editor-border-subtle last:border-b-0 hover:bg-editor-raised/60">
                  <td className="px-4 py-3">
                    <Link href={`/proposals/${row.id}/editor`} prefetch={false} className="font-semibold text-editor-text-strong hover:text-editor-brand">{row.title}</Link>
                    <p className="text-xs text-editor-text-subtle">{row.proposalNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-editor-text">{row.clientName}</td>
                  <td className="px-4 py-3 tabular-nums text-editor-text">{row.value}</td>
                  <td className="px-4 py-3">
                    <EditorStatusBadge tone={STATUS_TONE[row.status]} className="capitalize">{row.status}</EditorStatusBadge>
                  </td>
                  <td className="px-4 py-3 text-editor-text-muted">{row.designName}</td>
                  <td className="px-4 py-3 tabular-nums text-editor-text-muted">{row.pageCount}</td>
                  <td className="px-4 py-3 text-editor-text-muted">{new Date(row.lastActivityAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/proposals/${row.id}/editor`} prefetch={false} aria-label={`Open ${row.title} in editor`} className={editorButtonStyles({ variant: "ghost", size: "icon" })}>
                        <FileEdit className="size-4" aria-hidden="true" />
                      </Link>
                      <Link href={`/proposals/${row.id}/preview`} prefetch={false} aria-label={`Preview ${row.title}`} className={editorButtonStyles({ variant: "ghost", size: "icon" })}>
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      <EditorButton type="button" variant="ghost" size="icon" aria-label={`Duplicate ${row.title}`} disabled={pendingId === row.id} onClick={() => void handleDuplicate(row.id)}>
                        <Copy className="size-4" aria-hidden="true" />
                      </EditorButton>
                      {row.status === "archived" ? (
                        <EditorButton type="button" variant="ghost" size="icon" aria-label={`Restore ${row.title}`} disabled={pendingId === row.id} onClick={() => void runAction(row.id, () => restoreProposal(row.id))}>
                          <ArchiveRestore className="size-4" aria-hidden="true" />
                        </EditorButton>
                      ) : (
                        <EditorButton type="button" variant="ghost" size="icon" aria-label={`Archive ${row.title}`} disabled={pendingId === row.id} onClick={() => void runAction(row.id, () => archiveProposal(row.id))}>
                          <Archive className="size-4" aria-hidden="true" />
                        </EditorButton>
                      )}
                      {row.status === "draft" ? (
                        <EditorButton type="button" variant="ghost" size="icon" aria-label={`Delete ${row.title}`} disabled={pendingId === row.id} onClick={() => handleDelete(row.id, row.title)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </EditorButton>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
