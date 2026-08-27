import { Globe, TriangleAlert, type LucideIcon } from "lucide-react";

export type BrandLogo =
  | { kind: "text"; wordmark: string }
  | { kind: "image"; src: string; srcOnDark?: string; alt: string; width: number; height: number };

export type BrandIcon =
  | { kind: "emoji"; value: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "component"; Icon: LucideIcon };

/**
 * Single source of truth for document-facing brand assets that today render
 * as text/generic-icon stand-ins. Flip an entry to "image" and add its file
 * under public/brand/ once the owner-approved asset arrives — see
 * docs/BRAND_ASSET_PACK.md for the expected file paths. No other file needs
 * to change.
 */
export const BRAND_LOGO: BrandLogo = {
  kind: "image",
  src: "/brand/logo/wordmark.png",
  // The mark is dark-on-transparent, so "SAFARIS" and the fist's outlines
  // disappear where it sits over a photo or a dark band. Reversed variant for
  // those placements; drop it (and the prop) if a supplied logo reads on both.
  srcOnDark: "/brand/logo/wordmark-on-dark.png",
  alt: "Melanated Safaris",
  // Intrinsic pixels of the file, used for the aspect ratio; call sites set the
  // rendered height. Extracted from reference/pdf-pages/page-01.png, the only
  // copy of the mark in the repo, so it is soft above ~170px wide — replace it
  // with the vector original when the owner supplies one, keeping this shape.
  width: 169,
  height: 64,
};

export const BRAND_ICONS: Record<"globe" | "warning", BrandIcon> = {
  globe: { kind: "component", Icon: Globe },
  warning: { kind: "component", Icon: TriangleAlert },
};
