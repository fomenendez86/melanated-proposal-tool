/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: flat navigation instead of collapsible submenus, this app's routes
 * and Phosphor icons, the brand mark instead of the template's logo images,
 * light-only, and the promotional sidebar widget removed.
 */
"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useSidebar } from "./SidebarContext";
import type { AppArea } from "./areas";
import { cn } from "@/lib/utils";

interface SidebarItem {
  area: AppArea;
  label: string;
  href: string;
  icon: ReactNode;
}

export default function AdminSidebar({ active, items }: { active: AppArea; items: SidebarItem[] }) {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered, closeMobileSidebar } = useSidebar();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      aria-label="Application navigation"
      className={cn(
        "fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 ease-in-out print:hidden",
        showLabels ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex py-8", showLabels ? "justify-start" : "lg:justify-center")}>
        <Link href="/proposals" prefetch={false} className="flex items-center gap-3" onClick={closeMobileSidebar}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo/wordmark.png"
            alt="Melanated Safaris"
            width={169}
            height={64}
            className={cn("w-auto", showLabels ? "h-11" : "h-8")}
          />
        </Link>
      </div>

      <nav className="flex flex-col overflow-y-auto" aria-label="Workspace areas">
        <h2
          className={cn(
            "mb-4 flex text-theme-xs uppercase leading-5 text-gray-400",
            showLabels ? "justify-start" : "lg:justify-center"
          )}
        >
          {showLabels ? "Menu" : <span aria-hidden="true">•••</span>}
        </h2>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = item.area === active;
            return (
              <li key={item.area}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMobileSidebar}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isActive ? "bg-brand-50 text-brand-500" : "text-gray-700 hover:bg-gray-100",
                    showLabels ? "justify-start" : "lg:justify-center"
                  )}
                >
                  <span className={cn("flex size-6 shrink-0 items-center justify-center", isActive ? "text-brand-500" : "text-gray-500 group-hover:text-gray-700")}>
                    {item.icon}
                  </span>
                  <span className={cn(showLabels ? "inline" : "lg:hidden")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export type { SidebarItem };
