"use client";

import { ArrowLeft, IconContext, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import ApplicationRail from "./ApplicationRail";
import type { AppArea } from "./ApplicationRail";

export default function AppShell({
  active,
  title,
  subtitle,
  backHref,
  proposalId,
  headerActions,
  children,
}: {
  active: AppArea;
  title: string;
  subtitle?: string;
  backHref?: string;
  proposalId?: number;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <IconContext.Provider value={{ weight: "duotone" }}>
      <main className="bg-editor-panel font-editor text-editor-text-strong print:bg-white">
        <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-editor-panel print:block print:h-auto print:min-h-0 print:overflow-visible md:h-dvh md:min-h-0 md:flex-row">
          <ApplicationRail active={active} proposalId={proposalId} className="order-2 print:hidden md:order-none" />
          <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col print:block md:order-none">
            <header className="z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-editor-border-subtle bg-editor-panel/95 px-4 backdrop-blur print:hidden sm:px-5">
              {backHref ? (
                <Link
                  href={backHref}
                  prefetch={false}
                  aria-label="Go back"
                  className="grid size-10 shrink-0 place-items-center rounded-editor-md text-editor-text-muted transition hover:bg-editor-inset hover:text-editor-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editor-focus"
                >
                  <ArrowLeft className="size-5" aria-hidden="true" />
                </Link>
              ) : null}
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-[-0.01em] text-editor-text-strong sm:text-lg">{title}</h1>
                {subtitle ? <p className="truncate text-xs text-editor-text-muted">{subtitle}</p> : null}
              </div>
              <div className="pointer-events-none absolute left-1/2 hidden h-10 w-[min(28vw,360px)] -translate-x-1/2 items-center gap-2 rounded-full bg-editor-inset px-4 text-sm text-editor-text-subtle xl:flex">
                <MagnifyingGlass className="size-4" aria-hidden="true" />
                <span>Proposal Studio</span>
                <span className="ml-auto rounded-editor-sm bg-editor-raised px-2 py-1 text-[10px] font-semibold text-editor-text-muted shadow-sm">Workspace</span>
              </div>
              {headerActions ? <div className="ml-auto flex min-w-0 items-center gap-2">{headerActions}</div> : null}
            </header>
            <div className="min-h-0 flex-1 overflow-auto bg-editor-panel-muted print:overflow-visible print:bg-white">{children}</div>
          </div>
        </div>
      </main>
    </IconContext.Provider>
  );
}
