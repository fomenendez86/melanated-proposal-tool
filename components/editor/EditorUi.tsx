"use client";

import { ImageSquare, X } from "@phosphor-icons/react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ChangeEvent, ReactNode } from "react";

import type { ProposalEditorField } from "@/lib/editor/proposalEditorTypes";
import { cn } from "@/lib/utils";

export const editorFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editor-focus focus-visible:ring-offset-2";

type EditorButtonVariant = "primary" | "secondary" | "ghost";
type EditorButtonSize = "sm" | "md" | "icon";

export function editorButtonStyles({
  variant = "secondary",
  size = "md",
}: {
  variant?: EditorButtonVariant;
  size?: EditorButtonSize;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-editor-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-editor-disabled disabled:text-editor-disabled-text",
    editorFocusRing,
    variant === "primary" && "bg-editor-brand text-white hover:bg-editor-brand-hover",
    variant === "secondary" &&
      "border border-editor-border bg-editor-raised text-editor-text hover:border-editor-border-strong hover:bg-editor-inset",
    variant === "ghost" && "text-editor-text-muted hover:bg-editor-inset",
    size === "sm" && "h-11 px-3",
    size === "md" && "h-11 px-3.5",
    size === "icon" && "size-11 p-0"
  );
}

export const EditorButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: EditorButtonVariant;
    size?: EditorButtonSize;
  }
>(function EditorButton({ variant, size, className, ...props }, ref) {
  return <button ref={ref} className={cn(editorButtonStyles({ variant, size }), className)} {...props} />;
});

export function EditorPanelHeader({
  icon,
  label,
  count,
  onClose,
  closeLabel,
}: {
  icon: ReactNode;
  label: string;
  count?: number;
  onClose?: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-editor-border-subtle px-4">
      <div className="flex items-center gap-2">
        <span className="text-editor-text-muted" aria-hidden="true">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-editor-text-muted">{label}</span>
        {typeof count === "number" ? (
          <span className="rounded-full bg-editor-inset px-2 py-0.5 text-xs font-semibold text-editor-text-muted">
            {count}
          </span>
        ) : null}
      </div>
      {onClose ? (
        <EditorButton
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={closeLabel ?? `Close ${label.toLowerCase()}`}
          data-dialog-initial-focus
        >
          <X className="size-5" aria-hidden="true" />
        </EditorButton>
      ) : null}
    </div>
  );
}

export function EditorNotice({
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
        "rounded-editor-lg border p-4 text-sm",
        tone === "info" && "border-editor-border-subtle bg-editor-raised text-editor-text-muted",
        tone === "warning" && "border-editor-warning-border bg-editor-warning-surface text-editor-warning",
        tone === "danger" && "border-editor-danger-border bg-editor-danger-surface text-editor-danger",
        tone === "success" && "border-editor-border-subtle bg-editor-success-surface text-editor-success",
        className
      )}
    >
      {title ? <h3 className="font-semibold text-current">{title}</h3> : null}
      <div className={cn(title && "mt-1.5", "leading-5")}>{children}</div>
    </section>
  );
}

export function EditorField({
  field,
  id,
  value,
  error,
  rows,
  onChange,
  onFocus,
}: {
  field: ProposalEditorField;
  id: string;
  value: string;
  error?: string;
  rows: number;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Notifies the canvas bridge that this field now has inspector focus. */
  onFocus?: () => void;
}) {
  const describedBy = error ? `error-${id}` : field.helpText ? `help-${id}` : undefined;
  const controlClass = cn(
    "mt-1.5 w-full rounded-editor-md border bg-editor-raised px-3 py-2.5 text-sm text-editor-text-strong outline-none transition placeholder:text-editor-text-subtle focus:border-editor-border-strong focus:ring-2 focus:ring-editor-border-strong/20",
    error ? "border-editor-danger" : "border-editor-border"
  );
  const commonProps = {
    id,
    name: field.name,
    value,
    maxLength: field.maxLength,
    required: field.required,
    placeholder: field.placeholder,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    onChange,
    onFocus,
    className: controlClass,
  };

  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-editor-text">
        {field.label}{field.required ? <span className="text-editor-danger"> *</span> : null}
      </label>
      {field.isImage ? (
        <div className="mt-1.5 flex h-20 items-center justify-center overflow-hidden rounded-editor-md border border-editor-border bg-editor-inset">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageSquare className="size-5 text-editor-text-subtle" aria-hidden="true" />
          )}
        </div>
      ) : null}
      {field.multiline ? <textarea {...commonProps} rows={rows} /> : <input {...commonProps} type="text" />}
      <div className="mt-1 flex items-start justify-between gap-2 text-[11px]">
        <span
          id={describedBy}
          className={error ? "text-editor-danger" : "text-editor-text-subtle"}
        >
          {error ?? field.helpText ?? ""}
        </span>
        <span className="shrink-0 tabular-nums text-editor-text-subtle">
          {value.length}/{field.maxLength}
        </span>
      </div>
    </div>
  );
}

export function EditorInspectorSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="text-xs font-bold uppercase tracking-[0.12em] text-editor-text-muted">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function EditorSegmentedControl<T extends string>({
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
      className={cn(
        "inline-flex items-center rounded-editor-md border border-editor-border bg-editor-raised p-0.5 shadow-sm",
        className
      )}
      role="group"
      aria-label={label}
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
              "h-11 rounded-editor-sm px-3 text-xs font-semibold transition",
              editorFocusRing,
              active ? "bg-editor-brand text-white" : "text-editor-text-muted hover:bg-editor-inset"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EditorStatusBadge({
  tone = "neutral",
  icon,
  children,
  live,
  className,
}: {
  tone?: "neutral" | "warning" | "success" | "danger";
  icon?: ReactNode;
  children: ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone === "neutral" && "bg-editor-inset text-editor-text-muted",
        tone === "warning" && "bg-editor-warning-surface text-editor-warning",
        tone === "success" && "bg-editor-success-surface text-editor-success",
        tone === "danger" && "bg-editor-danger-surface text-editor-danger",
        className
      )}
      aria-live={live ? "polite" : undefined}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

export function EditorPageCard({
  active,
  pageNumber,
  title,
  description,
  eyebrow,
  thumbnail,
  thumbnailHeight,
  status,
  onSelect,
  dragHandle,
  dragging,
  dropIndicator,
  cardRef,
}: {
  active: boolean;
  pageNumber: number;
  title: string;
  description: string;
  eyebrow: string;
  thumbnail: ReactNode;
  thumbnailHeight?: number;
  status?: "ready" | "warning" | "error" | "hidden";
  onSelect: () => void;
  dragHandle?: ReactNode;
  dragging?: boolean;
  dropIndicator?: "before" | "after";
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={cardRef} className="relative">
      {dropIndicator === "before" ? (
        <div aria-hidden="true" className="absolute -top-1.5 inset-x-2 z-10 h-0.5 rounded-full bg-editor-brand" />
      ) : null}
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
        className={cn(
          "flex min-h-20 w-full items-start gap-3 rounded-editor-lg border border-l-[3px] p-2.5 text-left transition",
          editorFocusRing,
          dragging
            ? "border-dashed border-editor-brand opacity-60"
            : active
              ? "border-editor-border-strong border-l-editor-accent bg-editor-raised shadow-editor-card"
              : "border-transparent border-l-transparent hover:border-editor-border-subtle hover:bg-editor-raised/80"
        )}
      >
        {dragHandle ? (
          <span
            className="mt-1 shrink-0 cursor-grab touch-none text-editor-text-subtle active:cursor-grabbing"
            aria-hidden="true"
          >
            {dragHandle}
          </span>
        ) : null}
        <div
          className={cn(
            "relative w-12 shrink-0 overflow-hidden rounded-editor-sm border bg-editor-raised",
            active ? "border-editor-border-strong" : "border-editor-border"
          )}
          style={{ height: thumbnailHeight ?? 62 }}
        >
          {thumbnail}
          <span className="absolute bottom-0 right-0 grid min-h-4 min-w-4 place-items-center rounded-tl bg-editor-raised/90 px-1 text-[10px] font-bold tabular-nums text-editor-text">
            {pageNumber}
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className={cn("truncate text-sm font-semibold", active ? "text-editor-brand" : "text-editor-text")}>
            {title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-editor-text-muted">{description}</p>
          <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-editor-text-muted">
            {eyebrow}
          </p>
          {status && status !== "ready" ? (
            <span className={cn(
              "mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
              status === "error" ? "bg-editor-danger-surface text-editor-danger" : "bg-editor-warning-surface text-editor-warning"
            )}>{status}</span>
          ) : null}
        </div>
      </button>
      {dropIndicator === "after" ? (
        <div aria-hidden="true" className="absolute -bottom-1.5 inset-x-2 z-10 h-0.5 rounded-full bg-editor-brand" />
      ) : null}
    </div>
  );
}

export function EditorEmptyState({
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
    <div className={cn("text-center", compact ? "px-3 py-8" : "rounded-editor-lg border border-editor-border-subtle bg-editor-raised p-6")}>
      {icon ? <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-editor-inset text-editor-text-muted" aria-hidden="true">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-editor-text">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-editor-text-muted">{description}</p>
    </div>
  );
}

export const EditorDrawer = forwardRef<
  HTMLDivElement,
  {
    side: "left" | "right";
    label: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    panelClassName?: string;
  }
>(function EditorDrawer({ side, label, onClose, children, className, panelClassName }, ref) {
  return (
    <div ref={ref} className={cn("fixed inset-0 z-50", className)} role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-editor-overlay"
      />
      <aside
        className={cn(
          "absolute inset-y-0 w-[min(90vw,360px)] border-editor-border bg-editor-panel shadow-editor-page",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          panelClassName
        )}
      >
        {children}
      </aside>
    </div>
  );
});
