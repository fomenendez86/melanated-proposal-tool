interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="whitespace-nowrap text-sm font-bold uppercase tracking-wide">
        {title}
      </h2>
      <div className="mt-px h-px flex-1 bg-neutral-800" />
    </div>
  );
}
