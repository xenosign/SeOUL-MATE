import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nearly every page is per-user (Supabase session cookies), so we use the
  // classic dynamic rendering model instead of Cache Components.
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
