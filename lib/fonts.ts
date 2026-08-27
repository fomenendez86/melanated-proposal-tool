import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable}`;
