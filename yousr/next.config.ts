import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components are deliberately disabled: every page renders per-user
  // reproductive-health data behind consent checks and must never be cached
  // in a shared static shell.
  cacheComponents: false,
  // forbidden() lets a consent refusal answer with a real HTTP 403 rather
  // than a 200 page that merely looks blocked.
  experimental: { authInterrupts: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
