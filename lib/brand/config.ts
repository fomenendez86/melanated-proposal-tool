import { Globe, TriangleAlert, type LucideIcon } from "lucide-react";

export type BrandLogo =
  | { kind: "text"; wordmark: string }
  | { kind: "image"; src: string; alt: string };

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
  kind: "text",
  wordmark: "Melanated Safaris",
};

export const BRAND_ICONS: Record<"globe" | "warning", BrandIcon> = {
  globe: { kind: "component", Icon: Globe },
  warning: { kind: "component", Icon: TriangleAlert },
};
