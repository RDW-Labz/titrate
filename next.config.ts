import type { NextConfig } from "next";

// GitHub Pages serves the app under /titrate; CI sets this. Empty means the root, so `next dev` stays on :3000.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // static export: GitHub Pages has no server. A dynamic segment cannot enumerate localStorage ids, so
  // per-compound pages ride the query (?id=) and Suspense lets useSearchParams prerender.
  output: "export",
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
