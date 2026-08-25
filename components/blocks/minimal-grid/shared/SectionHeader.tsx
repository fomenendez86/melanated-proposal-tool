import type { EditableRegionAttributes } from "@/lib/editor/editableRegions";

interface SectionHeaderProps {
  title: string;
  /** Spread onto the title text only, never the decorative tick. */
  titleRegionProps?: EditableRegionAttributes;
}

/**
 * Minimal Grid's section marker: a short accent tick followed by a
 * small-caps label — the inverse rhythm of Safari Editorial's
 * label-then-full-width-rule (components/blocks/shared/SectionHeader.tsx).
 */
export default function SectionHeader({ title, titleRegionProps }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 shrink-0 bg-[var(--design-accent,#d8c8a8)]" />
      <h2 {...titleRegionProps} className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--design-primary,#20252b)]">
        {title}
      </h2>
    </div>
  );
}
