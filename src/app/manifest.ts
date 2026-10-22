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
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
