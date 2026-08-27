"use client";

import {
  Archive,
  ArrowUUpLeft,
  Bell,
  ChartLineUp,
  ClockCounterClockwise,
  FileText,
  Trophy,
  Copy,
  Eye,
  ArrowCounterClockwise,
  MagnifyingGlass,
  Trash,
  XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { archiveProposal, deleteProposal, duplicateProposalFromDashboard, markProposalLost, reopenProposal, restoreProposal } from "@/app/proposals/actions";
import AppShell from "@/components/admin/AdminShell";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/ui/AdminUi";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/admin/ui/Table";
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

const STATUS_TONE: Record<ProposalStatus, AdminBadgeTone> = {
  draft: "neutral",
  sent: "info",
  viewed: "warning",
  approved: "success",
  won: "success",
  lost: "danger",
  archived: "neutral",
};

const OPEN_STATUSES: ProposalStatus[] = ["draft", "sent", "viewed", "approved"];
const AWAITING_STATUSES: ProposalStatus[] = ["sent", "viewed"];

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10";

function MetricTile({ label, value, icon, badge }: { label: string; value: string; icon: ReactNode; badge?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800">{icon}</div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-theme-sm text-gray-500">{label}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm">{value}</h4>
        </div>
        {badge}
      </div>
    </div>
  );
}

type SortMode = "activity" | "value" | "name";

const selectClass =
  "h-11 rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10";

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

  const openRows = rows.filter((row) => OPEN_STATUSES.includes(row.status));
  const pipelineValue = openRows.reduce((total, row) => total + (row.valueRaw ?? 0), 0);
  const wonCount = rows.filter((row) => row.status === "won").length;
  const awaitingCount = rows.filter((row) => AWAITING_STATUSES.includes(row.status)).length;
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <AppShell
      active="proposals"
      title="Proposals"
      subtitle={`${rows.length} proposal${rows.length === 1 ? "" : "s"} total`}
      headerActions={(
        <>
          <Link
            href="/proposals/notifications"
            prefetch={false}
            aria-label={`${unreadNotifications} unread notifications`}
            className="relative grid size-10 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadNotifications > 0 ? (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-error-500 text-[9px] font-medium text-white">
                {unreadNotifications}
              </span>
            ) : null}
          </Link>
          <CreateProposalDialog clients={clients} designs={designs} existingProposals={existingProposals} templates={templateOptions} itineraries={itineraries} />
        </>
      )}
    >
      <div className="space-y-5 md:space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
          <MetricTile label="Open proposals" value={String(openRows.length)} icon={<FileText className="size-6" aria-hidden="true" />} />
          <MetricTile
            label="Pipeline value"
            value={pipelineValue > 0 ? currencyFormatter.format(pipelineValue) : "—"}
            icon={<ChartLineUp className="size-6" aria-hidden="true" />}
          />
          <MetricTile label="Awaiting client" value={String(awaitingCount)} icon={<ClockCounterClockwise className="size-6" aria-hidden="true" />} />
          <MetricTile
            label="Won"
            value={String(wonCount)}
            icon={<Trophy className="size-6" aria-hidden="true" />}
            badge={wonCount > 0 ? <AdminStatusBadge tone="success">Closed</AdminStatusBadge> : undefined}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px] flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                aria-label="Search proposals"
                placeholder="Search by name, client, or number"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputClass} pl-9`}
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

          {error ? <p className="border-b border-gray-100 px-5 py-3 text-theme-sm font-medium text-error-600">{error}</p> : null}

          {visibleRows.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-theme-sm font-medium text-gray-700">No proposals match</p>
              <p className="mt-1 text-theme-sm text-gray-500">Try a different search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Proposal</TableCell>
                    <TableCell isHeader>Client</TableCell>
                    <TableCell isHeader>Status</TableCell>
                    <TableCell isHeader className="text-right">Value</TableCell>
                    <TableCell isHeader>Last activity</TableCell>
                    <TableCell isHeader className="text-right">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {row.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.coverImageUrl} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="grid size-full place-items-center bg-brand-50 text-theme-xs font-medium text-brand-500">
                                {row.designName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/proposals/${row.id}/editor`} prefetch={false} className="block truncate font-medium text-gray-800 hover:text-brand-500">
                              {row.title}
                            </Link>
                            <p className="truncate text-theme-xs text-gray-500">{row.proposalNumber} · {row.pageCount} pages · {row.designName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{row.clientName}</TableCell>
                      <TableCell>
                        <AdminStatusBadge tone={STATUS_TONE[row.status]} className="capitalize">{row.status}</AdminStatusBadge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-gray-800">{row.value}</TableCell>
                      <TableCell className="whitespace-nowrap">{new Date(row.lastActivityAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/proposals/${row.id}/preview`}
                            prefetch={false}
                            aria-label={`Preview ${row.title}`}
                            className="grid size-9 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Link>
                          <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Duplicate ${row.title}`} disabled={pendingId === row.id} onClick={() => void handleDuplicate(row.id)}>
                            <Copy className="size-4" aria-hidden="true" />
                          </AdminButton>
                          {!["draft", "lost", "won", "archived"].includes(row.status) ? (
                            <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Mark ${row.title} lost`} disabled={pendingId === row.id} onClick={() => handleLost(row.id)}>
                              <XCircle className="size-4" aria-hidden="true" />
                            </AdminButton>
                          ) : null}
                          {["lost", "won", "approved"].includes(row.status) ? (
                            <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Reopen ${row.title}`} disabled={pendingId === row.id} onClick={() => void handleReopen(row.id)}>
                              <ArrowCounterClockwise className="size-4" aria-hidden="true" />
                            </AdminButton>
                          ) : null}
                          {row.status === "archived" ? (
                            <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Restore ${row.title}`} disabled={pendingId === row.id} onClick={() => void runAction(row.id, () => restoreProposal(row.id))}>
                              <ArrowUUpLeft className="size-4" aria-hidden="true" />
                            </AdminButton>
                          ) : (
                            <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Archive ${row.title}`} disabled={pendingId === row.id} onClick={() => void runAction(row.id, () => archiveProposal(row.id))}>
                              <Archive className="size-4" aria-hidden="true" />
                            </AdminButton>
                          )}
                          {row.status === "draft" ? (
                            <AdminButton variant="ghost" size="icon" className="size-9" aria-label={`Delete ${row.title}`} disabled={pendingId === row.id} onClick={() => handleDelete(row.id, row.title)}>
                              <Trash className="size-4" aria-hidden="true" />
                            </AdminButton>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
