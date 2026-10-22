import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Titrate — peptide protocol tracker",
    short_name: "Titrate",
    description: "Doses, cycles, reconstitution math and levels for peptides and GLP-1s.",
    start_url: "/",
    display: "standalone",
    background_color: "#edf1f5",
    theme_color: "#101c26",
    shortcuts: [
      { name: "Log today's dose", short_name: "Log", url: "/" },
      { name: "Reconstitution calculator", short_name: "Calc", url: "/calc" },
      { name: "Search peptides", short_name: "Search", url: "/protocols?focus=search" },
      { name: "Clinician summary", short_name: "Summary", url: "/summary" },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
