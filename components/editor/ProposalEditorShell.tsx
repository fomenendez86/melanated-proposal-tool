"use client";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Download,
  Eye,
  FileText,
  ImageIcon,
  Layers3,
  Minus,
  PanelLeftClose,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { ProposalSummary } from "@/lib/db/getProposalSummary";
import type { ProposalPageMeta } from "@/lib/editor/proposalPageMeta";

interface ProposalEditorShellProps {
  proposal: ProposalSummary;
  pageMeta: ProposalPageMeta[];
  pages: ReactNode[];
}

const STATUS_COPY: Record<ProposalSummary["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  expired: "Expired",
};

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 0.9;
const ZOOM_STEP = 0.05;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

export default function ProposalEditorShell({ proposal, pageMeta, pages }: ProposalEditorShellProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(0.65);
  const [filter, setFilter] = useState("");

  const selectedPage = pageMeta[selectedIndex];
  const filteredPages = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return pageMeta;
    return pageMeta.filter((page) =>
      `${page.pageNumber} ${page.eyebrow} ${page.title} ${page.description}`
        .toLowerCase()
        .includes(query)
    );
  }, [filter, pageMeta]);

  function selectPage(page: ProposalPageMeta) {
    const index = pageMeta.findIndex((candidate) => candidate.id === page.id);
    if (index >= 0) setSelectedIndex(index);
  }

  function moveSelection(direction: -1 | 1) {
    setSelectedIndex((current) =>
      Math.min(pageMeta.length - 1, Math.max(0, current + direction))
    );
  }

  return (
    <main className="flex h-dvh min-h-[720px] flex-col overflow-hidden bg-[#edece7] text-[#17231f]">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#d8d8d2] bg-[#fbfbf8] px-4 shadow-[0_1px_0_rgba(23,35,31,0.04)] lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Back to proposals"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#d8d8d2] bg-white text-[#35443f] transition hover:border-[#aab3ae] hover:bg-[#f4f4ef]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="hidden size-9 shrink-0 place-items-center rounded-lg bg-[#173b32] text-[#f6c85f] sm:grid">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-[#17231f] sm:text-[15px]">
                {proposal.title}
              </h1>
              <span className="hidden rounded-full bg-[#f1ead8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b6228] md:inline-flex">
                {STATUS_COPY[proposal.status]}
              </span>
            </div>
            <p className="truncate text-xs text-[#718078]">
              {proposal.proposalNumber} · {proposal.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-1 hidden items-center gap-1.5 text-xs text-[#668076] lg:flex">
            <Check className="size-3.5" /> Saved
          </div>
          <Link
            href={`/proposals/${proposal.id}/preview`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#ccd2ce] bg-white px-3 text-xs font-semibold text-[#304039] transition hover:border-[#9da9a3] hover:bg-[#f7f7f3]"
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">Client preview</span>
          </Link>
          <button
            type="button"
            disabled
            title="PDF generation from the editor arrives in Phase 6"
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-lg bg-[#173b32] px-3.5 text-xs font-semibold text-white opacity-75"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Generate PDF</span>
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_288px]">
        <aside className="hidden min-h-0 flex-col border-r border-[#d9d9d3] bg-[#f8f8f5] lg:flex">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#dfdfd9] px-4">
            <div className="flex items-center gap-2">
              <Layers3 className="size-4 text-[#496158]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#506159]">Pages</span>
              <span className="rounded-full bg-[#e7e9e4] px-1.5 py-0.5 text-[10px] font-semibold text-[#6d7872]">
                {pageMeta.length}
              </span>
            </div>
            <PanelLeftClose className="size-4 text-[#89938e]" />
          </div>

          <div className="p-3">
            <label className="flex h-8 items-center gap-2 rounded-lg border border-[#d9ddd9] bg-white px-2.5 text-[#7b8781] focus-within:border-[#8ba097]">
              <Search className="size-3.5" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Find a page"
                className="min-w-0 flex-1 bg-transparent text-xs text-[#293831] outline-none placeholder:text-[#9ba39f]"
              />
            </label>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 pb-3" aria-label="Proposal pages">
            {filteredPages.map((page) => {
              const active = page.id === selectedPage.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => selectPage(page)}
                  className={`group flex w-full items-start gap-2.5 rounded-xl border p-2 text-left transition ${
                    active
                      ? "border-[#aabbb3] bg-white shadow-[0_5px_18px_rgba(29,52,44,0.08)]"
                      : "border-transparent hover:border-[#dfe2de] hover:bg-white/70"
                  }`}
                >
                  <div className={`relative grid h-[58px] w-[45px] shrink-0 place-items-center overflow-hidden rounded border ${active ? "border-[#6f8d80] bg-[#edf2ee]" : "border-[#d7dbd7] bg-white"}`}>
                    <FileText className={`size-4 ${active ? "text-[#375c4d]" : "text-[#a0aaa5]"}`} />
                    <span className="absolute bottom-1 right-1 text-[8px] font-bold tabular-nums text-[#7e8984]">{page.pageNumber}</span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className={`truncate text-xs font-semibold ${active ? "text-[#193a30]" : "text-[#394841]"}`}>{page.title}</p>
                    <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.08em] text-[#8a948f]">{page.eyebrow}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#6e7f77]">
                      <span className="size-1.5 rounded-full bg-[#4d8a6e]" /> Ready
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#dfdfd9] p-3">
            <button
              type="button"
              disabled
              title="Section composition arrives in Phase 5"
              className="flex h-9 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-dashed border-[#bfc7c2] bg-white/60 text-xs font-semibold text-[#74817a]"
            >
              <Plus className="size-4" /> Add section
            </button>
          </div>
        </aside>

        <section className="relative flex min-h-0 min-w-0 flex-col bg-[#e9e8e3]">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#d4d4cf] bg-[#f4f4f0]/95 px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[#65736d]">
              <button type="button" onClick={() => moveSelection(-1)} disabled={selectedIndex === 0} aria-label="Previous page" className="grid size-7 place-items-center rounded-md border border-[#d4d8d5] bg-white disabled:opacity-35">
                <ChevronLeft className="size-3.5" />
              </button>
              <button type="button" onClick={() => moveSelection(1)} disabled={selectedIndex === pageMeta.length - 1} aria-label="Next page" className="grid size-7 place-items-center rounded-md border border-[#d4d8d5] bg-white disabled:opacity-35">
                <ChevronRight className="size-3.5" />
              </button>
              <span className="ml-1 truncate font-medium text-[#34453d]">{selectedPage.title}</span>
              <span className="hidden text-[#9aa29e] sm:inline">·</span>
              <span className="hidden tabular-nums sm:inline">Page {selectedPage.pageNumber} of {pageMeta.length}</span>
            </div>

            <div className="flex items-center rounded-lg border border-[#d4d8d5] bg-white p-0.5 shadow-sm">
              <button type="button" onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))} aria-label="Zoom out" className="grid size-7 place-items-center rounded-md text-[#53635c] hover:bg-[#f0f2ef]">
                <Minus className="size-3.5" />
              </button>
              <span className="w-11 text-center text-[10px] font-semibold tabular-nums text-[#53635c]">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))} aria-label="Zoom in" className="grid size-7 place-items-center rounded-md text-[#53635c] hover:bg-[#f0f2ef]">
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="flex min-h-full min-w-max items-start justify-center p-6 sm:p-10">
              <div className="relative shrink-0 shadow-[0_18px_55px_rgba(32,42,38,0.22)] ring-1 ring-black/5" style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}>
                <div className="absolute left-0 top-0 origin-top-left bg-white" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${zoom})` }}>
                  {pages[selectedIndex]}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col border-l border-[#d9d9d3] bg-[#fbfbf8] xl:flex">
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#dfdfd9] px-4">
            <Settings2 className="size-4 text-[#496158]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#506159]">Properties</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-[#e5e5df] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#839089]">{selectedPage.eyebrow}</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#20332b]">{selectedPage.title}</h2>
              <p className="mt-1.5 text-xs leading-5 text-[#6f7c76]">{selectedPage.description}</p>
            </div>

            <div className="space-y-5 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#839089]">Page information</p>
                <dl className="mt-2.5 divide-y divide-[#ecece7] rounded-xl border border-[#e0e2de] bg-white px-3">
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <dt className="text-[#7b8781]">Page</dt>
                    <dd className="font-semibold tabular-nums text-[#35483f]">{selectedPage.pageNumber} of {pageMeta.length}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <dt className="text-[#7b8781]">Block type</dt>
                    <dd className="max-w-[145px] truncate font-mono text-[10px] text-[#35483f]">{selectedPage.type}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <dt className="text-[#7b8781]">Status</dt>
                    <dd className="inline-flex items-center gap-1.5 font-semibold text-[#39745a]"><span className="size-1.5 rounded-full bg-[#4d8a6e]" /> Ready</dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#839089]">Content</p>
                  <span className="rounded-full bg-[#f1ead8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#826b34]">Phase 2</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <button type="button" disabled className="flex h-10 w-full cursor-not-allowed items-center justify-between rounded-lg border border-[#e0e2de] bg-white px-3 text-xs text-[#7d8882]">
                    <span className="flex items-center gap-2"><FileText className="size-3.5" /> Edit text and details</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                  <button type="button" disabled className="flex h-10 w-full cursor-not-allowed items-center justify-between rounded-lg border border-[#e0e2de] bg-white px-3 text-xs text-[#7d8882]">
                    <span className="flex items-center gap-2"><ImageIcon className="size-3.5" /> Manage images</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#eadfbe] bg-[#fffaf0] p-3">
                <div className="flex items-start gap-2.5">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#a47a20]" />
                  <div>
                    <p className="text-xs font-semibold text-[#6c531d]">Protected layout</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#8b7440]">This phase establishes visual navigation. Structured editing arrives next without enabling free positioning.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="hidden h-8 shrink-0 items-center justify-between border-t border-[#d4d4cf] bg-[#f8f8f5] px-4 text-[10px] text-[#75817b] sm:flex">
        <div className="flex items-center gap-3">
          <span>{pageMeta.length} pages</span>
          <span className="size-1 rounded-full bg-[#c5cbc7]" />
          <span>{proposal.travelDates}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[#4b755f]"><Check className="size-3" /> All pages ready</span>
          <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-1 opacity-60">Catalog <ChevronUp className="size-3" /></button>
        </div>
      </footer>
    </main>
  );
}
