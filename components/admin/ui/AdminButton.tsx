/*
 * Adapted from TailAdmin (free Next.js edition), MIT License,
 * Copyright (c) 2023 TailAdmin — see licenses/tailadmin-LICENSE.
 * Changes: forwards native button props (the upstream version only accepted
 * `onClick`, which server actions and `type="submit"` need), drops the `dark:`
 * variants, and takes its classes from `adminButtonStyles` so `<Link>`s can be
 * styled as buttons from the same source. Variant and size names mirror the
 * editor's kit — see the note at the top of AdminUi.tsx.
 */
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

import { adminButtonStyles, type AdminButtonSize, type AdminButtonVariant } from "./AdminUi";
import { cn } from "@/lib/utils";

export default function AdminButton({
  variant,
  size,
  startIcon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  startIcon?: ReactNode;
  // React 19 passes `ref` as a plain prop; the dialog trigger needs one to
  // restore focus when it closes.
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button {...props} className={cn(adminButtonStyles({ variant, size }), className)}>
      {startIcon ? <span className="flex items-center">{startIcon}</span> : null}
      {children}
    </button>
  );
}
