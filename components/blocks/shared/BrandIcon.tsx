import { BRAND_ICONS } from "@/lib/brand/config";

interface BrandIconProps {
  slot: keyof typeof BRAND_ICONS;
  className?: string;
}

export default function BrandIcon({ slot, className }: BrandIconProps) {
  const icon = BRAND_ICONS[slot];

  if (icon.kind === "image") {
    return <img src={icon.src} alt={icon.alt} className={className} />;
  }

  return <span className={className}>{icon.value}</span>;
}
