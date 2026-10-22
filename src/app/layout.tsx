import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Titrate — peptide protocol tracker",
  description:
    "Dose and cycle tracking, reconstitution math, estimated level curves and GLP-1 nutrition in one place.",
};

export const viewport: Viewport = { themeColor: "#e7ebee" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plex.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
