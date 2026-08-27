/*
 * Adapted from TailAdmin's `(admin)/layout.tsx` (free Next.js edition),
 * MIT License, Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: keeps the props the previous shell exposed (`active`, `title`,
 * `subtitle`, `backHref`, `proposalId`, `headerActions`) so the pages did not
 * have to change, owns the provider rather than sitting under a root one, and
 * keeps this app's print behaviour.
 */
"use client";

import { Bell, Books, IconContext, MapPinArea, NotePencil, SquaresFour } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import AdminHeader from "./AdminHeader";
import AdminSidebar, { type SidebarItem } from "./AdminSidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import type { AppArea } from "./areas";
import { cn } from "@/lib/utils";

function Backdrop() {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return <div className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" onClick={closeMobileSidebar} />;
}

function ShellFrame({
  active,
  items,
  title,
  subtitle,
  backHref,
  headerActions,
  children,
}: {
  active: AppArea;
  items: SidebarItem[];
  title: string;
  subtitle?: string;
  backHref?: string;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const contentMargin = isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-dvh bg-gray-50 font-admin print:bg-white">
      <AdminSidebar active={active} items={items} />
      <Backdrop />
      <div className={cn("flex min-h-dvh flex-col transition-all duration-300 ease-in-out print:ml-0", contentMargin)}>
        <AdminHeader title={title} subtitle={subtitle} backHref={backHref} actions={headerActions} />
        <div className="mx-auto w-full max-w-(--breakpoint-2xl) flex-1 p-4 md:p-6 print:p-0">{children}</div>
      </div>
    </div>
  );
}

export default function AdminShell({
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
  const items: SidebarItem[] = [
    { area: "proposals", label: "Proposals", href: "/proposals", icon: <SquaresFour className="size-5" /> },
    ...(proposalId
      ? [
          {
            area: "editor" as const,
            label: "Editor",
            href: `/proposals/${proposalId}/editor`,
            icon: <NotePencil className="size-5" />,
          },
        ]
      : []),
    { area: "itineraries", label: "Itineraries", href: "/proposals/itineraries", icon: <MapPinArea className="size-5" /> },
    { area: "templates", label: "Templates", href: "/proposals/templates", icon: <Books className="size-5" /> },
    { area: "notifications", label: "Notifications", href: "/proposals/notifications", icon: <Bell className="size-5" /> },
  ];

  return (
    <IconContext.Provider value={{ weight: "regular" }}>
      <SidebarProvider>
        <ShellFrame
          active={active}
          items={items}
          title={title}
          subtitle={subtitle}
          backHref={backHref}
          headerActions={headerActions}
        >
          {children}
        </ShellFrame>
      </SidebarProvider>
    </IconContext.Provider>
  );
}
