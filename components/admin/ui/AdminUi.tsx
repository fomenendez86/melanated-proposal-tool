/*
 * The admin surface's shared primitives, styled with the vendored admin tokens
 * (TailAdmin, MIT, Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE).
 *
 * The prop APIs mirror the editor kit in `components/editor/EditorUi.tsx` on
 * purpose: the two surfaces need the same shapes, and mirroring them keeps the
 * swap mechanical. They stay separate files because the editor's kit is
 * Broadsheet's and must not be restyled to serve this surface — see the scope
 * table in docs/EDITOR_DESIGN_SYSTEM.md.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const adminFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

export type AdminButtonVariant = "primary" | "secondary" | "ghost";
export type AdminButtonSize = "sm" | "md" | "icon";

export function adminButtonStyles({
  variant = "secondary",
  size = "md",
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-theme-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    adminFocusRing,
    variant === "primary" && "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    variant === "secondary" && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    variant === "ghost" && "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
    size === "sm" && "h-10 px-3",
    size === "md" && "h-11 px-4",
    size === "icon" && "size-10 p-0"
  );
}

export function AdminNotice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4 text-theme-sm",
        tone === "info" && "border-gray-200 bg-gray-50 text-gray-600",
        tone === "warning" && "border-warning-200 bg-warning-50 text-warning-700",
        tone === "danger" && "border-error-200 bg-error-50 text-error-600",
        tone === "success" && "border-success-200 bg-success-50 text-success-700",
        className
      )}
    >
      {title ? <h3 className="font-medium text-current">{title}</h3> : null}
      <div className={cn(title && "mt-1.5", "leading-5")}>{children}</div>
    </section>
  );
}

export type AdminBadgeTone = "neutral" | "info" | "warning" | "success" | "danger";

export function AdminStatusBadge({
  tone = "neutral",
  icon,
  children,
  live,
  className,
}: {
  tone?: "neutral" | "info" | "warning" | "success" | "danger";
  icon?: ReactNode;
  children: ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium",
        tone === "neutral" && "bg-gray-100 text-gray-700",
        tone === "info" && "bg-blue-light-50 text-blue-light-500",
        tone === "warning" && "bg-warning-50 text-warning-600",
        tone === "success" && "bg-success-50 text-success-600",
        tone === "danger" && "bg-error-50 text-error-600",
        className
      )}
      aria-live={live ? "polite" : undefined}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
  compact = false,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("text-center", compact ? "px-3 py-8" : "rounded-2xl border border-gray-200 bg-white p-6")}>
      {icon ? (
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="text-theme-sm font-medium text-gray-800">{title}</h3>
      <p className="mt-1 text-theme-sm leading-5 text-gray-500">{description}</p>
    </div>
  );
}
