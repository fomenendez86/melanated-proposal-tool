import { BRAND_LOGO } from "@/lib/brand/config";
import { cn } from "@/lib/utils";

/**
 * The logo slot. In text mode it prints the wordmark inline, inheriting the
 * type of whatever line it sits on; in image mode it needs a height of its own,
 * because a stacked logo (icon over wordmark over "SAFARIS") set to the 1em of
 * a 10px header line would be unreadable. The default is sized against the
 * small uppercase rules the call sites use — pass `className` with a height to
 * override it, as the cover does, and `onDark` where the mark sits over a photo
 * or a dark band.
 */
export default function BrandWordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  if (BRAND_LOGO.kind === "image") {
    return (
      <img
        src={onDark && BRAND_LOGO.srcOnDark ? BRAND_LOGO.srcOnDark : BRAND_LOGO.src}
        alt={BRAND_LOGO.alt}
        width={BRAND_LOGO.width}
        height={BRAND_LOGO.height}
        className={cn("inline-block h-[3.4em] w-auto align-middle", className)}
      />
    );
  }

  return <>{BRAND_LOGO.wordmark}</>;
}
