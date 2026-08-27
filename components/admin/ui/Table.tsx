/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: same component split, with the shared cell padding and header
 * styling folded in so call sites stop repeating it.
 */
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("min-w-full", className)}>{children}</table>;
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn("border-b border-gray-100", className)}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={cn("divide-y divide-gray-100", className)}>{children}</tbody>;
}

export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

export function TableCell({
  children,
  isHeader = false,
  className,
}: {
  children?: ReactNode;
  isHeader?: boolean;
  className?: string;
}) {
  const Tag = isHeader ? "th" : "td";
  return (
    <Tag
      className={cn(
        "px-5 py-4 text-left align-middle",
        isHeader ? "whitespace-nowrap text-theme-xs font-medium uppercase tracking-wide text-gray-500" : "text-theme-sm text-gray-700",
        className
      )}
    >
      {children}
    </Tag>
  );
}
