import type { EditableRegionAttributes } from "@/lib/editor/editableRegions";

interface SectionHeaderProps {
  title: string;
  /** Spread onto the title text only, never the decorative rule. */
  titleRegionProps?: EditableRegionAttributes;
}

export default function SectionHeader({ title, titleRegionProps }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 {...titleRegionProps} className="whitespace-nowrap text-sm font-bold uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-px h-px flex-1 bg-neutral-800" />
    </div>
  );
}
