/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: dropped the `dark:` variants (this app renders light-only) and the
 * unused solid/dark colours, and typed the colour union against the proposal
 * statuses this app actually shows.
 */
import type { ReactNode } from "react";

export type AdminBadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light";

const COLORS: Record<AdminBadgeColor, string> = {
  primary: "bg-brand-50 text-brand-500",
  success: "bg-success-50 text-success-600",
  error: "bg-error-50 text-error-600",
  warning: "bg-warning-50 text-warning-600",
  info: "bg-blue-light-50 text-blue-light-500",
  light: "bg-gray-100 text-gray-700",
};

export default function AdminBadge({
  color = "primary",
  size = "md",
  startIcon,
  children,
}: {
  color?: AdminBadgeColor;
  size?: "sm" | "md";
  startIcon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
        size === "sm" ? "text-theme-xs" : "text-sm"
      } ${COLORS[color]}`}
    >
      {startIcon ? <span className="flex items-center">{startIcon}</span> : null}
      {children}
    </span>
  );
}
