/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: the page title/subtitle and optional back link replace the
 * template's global search field, the theme toggle and notification/user
 * dropdowns are gone (this app is light-only and single-user), and logout is a
 * server-action form rather than a menu entry.
 */
"use client";

import { ArrowLeft, List, SignOut, X } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useSidebar } from "./SidebarContext";
import { logout } from "@/app/login/actions";

export default function AdminHeader({
  title,
  subtitle,
  backHref,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: ReactNode;
}) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 print:hidden md:px-6">
      <button
        type="button"
        aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
        onClick={toggleMobileSidebar}
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
      >
        {isMobileOpen ? <X className="size-5" /> : <List className="size-5" />}
      </button>

      <button
        type="button"
        aria-label="Collapse or expand navigation"
        onClick={toggleSidebar}
        className="hidden size-10 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:grid"
      >
        <List className="size-5" />
      </button>

      {backHref ? (
        <Link
          href={backHref}
          prefetch={false}
          aria-label="Go back"
          className="grid size-10 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <ArrowLeft className="size-5" />
        </Link>
      ) : null}

      <div className="min-w-0">
        <h1 className="truncate text-theme-xl font-semibold text-gray-800">{title}</h1>
        {subtitle ? <p className="truncate text-theme-sm text-gray-500">{subtitle}</p> : null}
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {actions}
        <form action={logout}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="grid size-10 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <SignOut className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
