"use client";

import { Archive, ArchiveRestore, Bell, Copy, Eye, LibraryBig, LogOut, MapPinned, RotateCcw, Search, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { logout } from "@/app/login/actions";
import { archiveProposal, deleteProposal, duplicateProposalFromDashboard, markProposalLost, reopenProposal, restoreProposal } from "@/app/proposals/actions";
import { EditorButton, EditorEmptyState, EditorStatusBadge, editorButtonStyles, editorFocusRing } from "@/components/editor/EditorUi";
import type { TemplateListRow } from "@/lib/db/getTemplateList";
import type { ItineraryPickerRow } from "@/lib/db/getItineraryList";
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
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "archived", label: "Archived" },
];

const STATUS_TONE: Record<ProposalStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  sent: "neutral",
  viewed: "warning",
  approved: "success",
  won: "success",
  lost: "danger",
  archived: "neutral",
};

type SortMode = "activity" | "value" | "name";

const selectClass = `h-11 rounded-lg border border-editor-border bg-editor-raised px-3 text-sm ${editorFocusRing}`;

export default function ProposalDashboard({
  rows,
  clients,
  designs,
  templates,
  itineraries,
  unreadNotifications,
}: {
  rows: ProposalListRow[];
  clients: ClientOption[];
  designs: DocumentDesignDescriptor[];
  templates: TemplateListRow[];
  itineraries: ItineraryPickerRow[];
  unreadNotifications: number;
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

  function handleLost(id: number) {
    const reason = window.prompt("Optional reason this proposal was lost:") ?? undefined;
    if (reason === undefined) return;
    void runAction(id, () => markProposalLost(id, reason));
  }

  async function handleReopen(id: number) {
    const result = await runAction(id, () => reopenProposal(id));
    if (result?.ok && result.id) router.push(`/proposals/${result.id}/editor`);
  }

  const existingProposals = rows.map((row) => ({ id: row.id, title: row.title }));
  const templateOptions = templates
    .filter((template) => template.status !== "archived")
    .map((template) => ({ id: template.id, title: template.name }));

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-5 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-editor-text-strong">Proposals</h1>
          <p className="mt-1 text-sm text-editor-text-muted">{rows.length} proposal{rows.length === 1 ? "" : "s"} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/proposals/notifications" prefetch={false} aria-label={`${unreadNotifications} unread notifications`} className={editorButtonStyles({ variant: "ghost" })}><Bell className="size-4" aria-hidden="true" />{unreadNotifications > 0 ? <span className="rounded-full bg-editor-danger px-1.5 py-0.5 text-[10px] text-white">{unreadNotifications}</span> : null}</Link>
          <Link href="/proposals/templates" prefetch={false} className={editorButtonStyles({ variant: "secondary" })}>
            <LibraryBig className="size-4" aria-hidden="true" />
            Templates
          </Link>
          <Link href="/proposals/itineraries" prefetch={false} className={editorButtonStyles({ variant: "secondary" })}>
            <MapPinned className="size-4" aria-hidden="true" />
            Itineraries
          </Link>
          <CreateProposalDialog clients={clients} designs={designs} existingProposals={existingProposals} templates={templateOptions} itineraries={itineraries} />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRows.map((row) => (
            <article key={row.id} className="group flex flex-col overflow-hidden rounded-xl border border-editor-border-subtle bg-editor-panel shadow-editor-card transition hover:border-editor-border-strong">
              <Link href={`/proposals/${row.id}/editor`} prefetch={false} className="relative block aspect-[4/3] overflow-hidden bg-editor-panel-muted">
                {row.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.coverImageUrl} alt="" className="size-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-editor-brand to-editor-brand-hover">
                    <span className="px-4 text-center text-sm font-semibold uppercase tracking-wide text-white/90">{row.designName}</span>
                  </div>
                )}
                <span className="absolute right-2 top-2">
                  <EditorStatusBadge tone={STATUS_TONE[row.status]} className="capitalize shadow-editor-toolbar">{row.status}</EditorStatusBadge>
                </span>
              </Link>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <Link href={`/proposals/${row.id}/editor`} prefetch={false} className="font-semibold text-editor-text-strong hover:text-editor-brand">{row.title}</Link>
                <p className="text-xs text-editor-text-subtle">{row.proposalNumber}</p>
                <p className="text-sm text-editor-text">{row.clientName}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-editor-text-muted">
                  <span className="tabular-nums text-sm font-semibold text-editor-text-strong">{row.value}</span>
                  <span>{new Date(row.lastActivityAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                  <span className="text-xs text-editor-text-subtle">{row.pageCount} pages · {row.designName}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/proposals/${row.id}/preview`} prefetch={false} aria-label={`Preview ${row.title}`} className={editorButtonStyles({ variant: "ghost", size: "icon" })}>
                      <Eye className="size-4" aria-hidden="true" />
                    </Link>
                    <EditorButton type="button" variant="ghost" size="icon" aria-label={`Duplicate ${row.title}`} disabled={pendingId === row.id} onClick={() => void handleDuplicate(row.id)}>
                      <Copy className="size-4" aria-hidden="true" />
                    </EditorButton>
                    {!["draft", "lost", "won", "archived"].includes(row.status) ? <EditorButton type="button" variant="ghost" size="icon" aria-label={`Mark ${row.title} lost`} disabled={pendingId === row.id} onClick={() => handleLost(row.id)}><XCircle className="size-4" aria-hidden="true" /></EditorButton> : null}
                    {["lost", "won", "approved"].includes(row.status) ? <EditorButton type="button" variant="ghost" size="icon" aria-label={`Reopen ${row.title}`} disabled={pendingId === row.id} onClick={() => void handleReopen(row.id)}><RotateCcw className="size-4" aria-hidden="true" /></EditorButton> : null}
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
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
