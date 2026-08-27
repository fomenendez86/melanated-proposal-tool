"use client";

import {
  Bell,
  Books,
  NotePencil,
  MapPinArea,
  SignOut,
  SquaresFour,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

export type AppArea = "proposals" | "editor" | "templates" | "itineraries" | "notifications";

function RailItem({
  active,
  href,
  label,
  children,
}: {
  active: boolean;
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-editor-md text-editor-text-muted transition hover:bg-editor-inset hover:text-editor-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editor-focus focus-visible:ring-offset-2",
        active && "bg-editor-accent text-white shadow-sm hover:bg-editor-accent hover:text-white"
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export default function ApplicationRail({
  active,
  proposalId,
  className,
  showMobile = true,
  showLogout = true,
}: {
  active: AppArea;
  proposalId?: number;
  className?: string;
  showMobile?: boolean;
  showLogout?: boolean;
}) {
  return (
    <aside
      aria-label="Application navigation"
      className={cn(
        "z-30 flex h-16 shrink-0 items-center border-t border-editor-border-subtle bg-editor-panel px-2 md:h-full md:w-16 md:flex-col md:border-r md:border-t-0 md:px-0 md:py-2",
        !showMobile && "hidden md:flex",
        className
      )}
    >
      <Link
        href="/proposals"
        prefetch={false}
        aria-label="Proposal Studio home"
        className="mb-0 mr-auto grid size-11 shrink-0 place-items-center rounded-editor-md bg-editor-text-strong text-white shadow-sm md:mb-5 md:mr-0"
      >
        <Sparkle className="size-5" aria-hidden="true" />
      </Link>

      <nav className="flex items-center gap-1 md:flex-col" aria-label="Workspace areas">
        <RailItem active={active === "proposals"} href="/proposals" label="Proposals">
          <SquaresFour className="size-[19px]" aria-hidden="true" />
        </RailItem>
        {proposalId ? (
          <RailItem active={active === "editor"} href={`/proposals/${proposalId}/editor`} label="Editor">
            <NotePencil className="size-[19px]" aria-hidden="true" />
          </RailItem>
        ) : null}
        <RailItem active={active === "itineraries"} href="/proposals/itineraries" label="Itineraries">
          <MapPinArea className="size-[19px]" aria-hidden="true" />
        </RailItem>
        <RailItem active={active === "templates"} href="/proposals/templates" label="Templates">
          <Books className="size-[19px]" aria-hidden="true" />
        </RailItem>
        <RailItem active={active === "notifications"} href="/proposals/notifications" label="Notifications">
          <Bell className="size-[19px]" aria-hidden="true" />
        </RailItem>
      </nav>

      {showLogout ? <form action={logout} className="ml-auto md:mb-14 md:ml-0 md:mt-auto">
        <button
          type="submit"
          aria-label="Log out"
          title="Log out"
          className="grid size-11 place-items-center rounded-editor-md text-editor-text-muted transition hover:bg-editor-inset hover:text-editor-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editor-focus focus-visible:ring-offset-2"
        >
          <SignOut className="size-[19px]" aria-hidden="true" />
        </button>
      </form> : null}
    </aside>
  );
}
