import { BRAND_LOGO } from "@/lib/brand/config";

export default function BrandWordmark() {
  if (BRAND_LOGO.kind === "image") {
    return (
      <img
        src={BRAND_LOGO.src}
        alt={BRAND_LOGO.alt}
        className="inline h-[1em] w-auto align-middle"
      />
    );
  }

  return <>{BRAND_LOGO.wordmark}</>;
}
