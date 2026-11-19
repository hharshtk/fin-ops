import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Dev-only: lets a Cloudflare quick tunnel load HMR and dev assets.
  allowedDevOrigins: ["*.trycloudflare.com"],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
