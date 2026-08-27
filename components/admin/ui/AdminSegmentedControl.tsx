/*
 * Written for the admin surface, mirroring the API of the editor's segmented
 * control so call sites swap one for the other, but styled with the vendored
 * admin tokens (see licenses/tailadmin-LICENSE for their origin). The editor's
 * version paints its active pill with the editor accent, which reads as a
 * different product next to the admin brand colour.
 */
"use client";

import { cn } from "@/lib/utils";

export default function AdminSegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1", className)}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-3 py-1.5 text-theme-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              active ? "bg-white text-gray-800 shadow-theme-xs" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
