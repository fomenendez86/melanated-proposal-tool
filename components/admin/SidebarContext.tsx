/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: dropped the submenu state (this app's navigation is flat) and the
 * unused `activeItem`, and the expanded/collapsed choice now persists per
 * browser. It is read through `useSyncExternalStore` rather than an effect, so
 * the server render and hydration both start from the expanded default and
 * React swaps in the stored value without a mismatch.
 */
"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "melanated.admin.sidebarExpanded";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readExpanded() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    // Private mode or blocked storage: the expanded default is fine.
    return true;
  }
}

function writeExpanded(next: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Non-fatal: the preference just does not survive the session.
  }
  for (const listener of listeners) listener();
}

interface SidebarContextValue {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setIsHovered: (hovered: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isExpanded = useSyncExternalStore(subscribe, readExpanded, () => true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = useCallback(() => writeExpanded(!readExpanded()), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((previous) => !previous), []);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ isExpanded, isMobileOpen, isHovered, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, setIsHovered }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
