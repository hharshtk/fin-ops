import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Archivo with its width axis: normal width for UI, condensed for timetable figures.
// Self-hosted at build time by next/font. latin-ext carries the ₹ glyph.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Fin Ops",
    template: "%s · Fin Ops",
  },
  description: "Practice management for Chartered Accountants in India.",
};

export const viewport: Viewport = {
  themeColor: "#1c2a48",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={archivo.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
