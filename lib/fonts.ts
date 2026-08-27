import { Allura, Geist, Geist_Mono, Outfit, Prata, Source_Serif_4 } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The document's display face. Prata is the high-contrast serif the original
// PDF used for its cover title and section display type, and it is OFL
// licensed, so it can ship. It fills the `--font-brand-heading` slot that
// app/globals.css already resolves `font-serif`/`font-heading` through — see
// docs/BRAND_ASSET_PACK.md. Single weight (400) and no italic by design.
export const brandHeading = Prata({
  variable: "--font-brand-heading",
  subsets: ["latin"],
  weight: "400",
});

// The document's script/accent role — the handwritten line the original PDF
// uses for "thank you", the divider subtitles and the cover's client line.
// Approved as a third typographic role (the design note in
// docs/BRAND_ASSET_PACK.md reserved that call for the owner). Allura is OFL
// licensed; single weight, and never combined with `italic`, which would slant
// an already-slanted script.
export const brandScript = Allura({
  variable: "--font-brand-script",
  subsets: ["latin"],
  weight: "400",
});

// Typeface of the vendored admin surface (the /proposals dashboard area). Kept
// in its own variable so it never leaks into the document or the editor chrome,
// which have their own faces — see docs/EDITOR_DESIGN_SYSTEM.md.
export const adminSans = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${brandHeading.variable} ${brandScript.variable} ${adminSans.variable} ${sourceSerif.variable}`;
