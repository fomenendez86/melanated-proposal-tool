import BrandWordmark from "@/components/blocks/shared/BrandWordmark";

interface PageHeaderProps {
  variant?: "full" | "labelOnly";
}

/**
 * Left-aligned wordmark / right-aligned "Proposal" label over a hairline
 * rule — Safari Editorial centers the wordmark instead
 * (components/blocks/shared/PageHeader.tsx).
 */
export default function PageHeader({ variant = "full" }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--design-secondary,#68727d)]/25 pb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--design-secondary,#68727d)]">
      <span>{variant === "full" ? <BrandWordmark /> : null}</span>
      <span>Proposal</span>
    </div>
  );
}
