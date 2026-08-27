/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: forwards native button props (the upstream version only accepted
 * `onClick`, which server actions and `type="submit"` need), drops the `dark:`
 * variants, and adds the `ghost`/`danger` variants plus an icon size this app's
 * row actions use.
 */
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2.5 text-theme-sm",
  md: "px-5 py-3 text-theme-sm",
  icon: "size-10",
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
  outline: "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
  ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  danger: "bg-white text-error-600 ring-1 ring-inset ring-error-200 hover:bg-error-50",
};

export default function AdminButton({
  variant = "primary",
  size = "md",
  startIcon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  startIcon?: ReactNode;
  // React 19 passes `ref` as a plain prop; the dialog trigger needs one to
  // restore focus when it closes.
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        SIZES[size],
        VARIANTS[variant],
        className
      )}
    >
      {startIcon ? <span className="flex items-center">{startIcon}</span> : null}
      {children}
    </button>
  );
}
