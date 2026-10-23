import type { MetadataRoute } from "next";

// basePath is not applied to manifest strings, so prefix them or the install prompt points at the org root
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// a route handler needs this before it can be exported as a file
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Titrate — peptide protocol tracker",
    short_name: "Titrate",
    description: "Doses, cycles, reconstitution math and levels for peptides and GLP-1s.",
    start_url: `${base}/`,
    display: "standalone",
    background_color: "#edf1f5",
    theme_color: "#101c26",
    shortcuts: [
      { name: "Log today's dose", short_name: "Log", url: `${base}/` },
      { name: "Reconstitution calculator", short_name: "Calc", url: `${base}/calc/` },
      { name: "Search peptides", short_name: "Search", url: `${base}/protocols/?focus=search` },
      { name: "Clinician summary", short_name: "Summary", url: `${base}/summary/` },
    ],
    icons: [
      { src: `${base}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
