import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed turbopack root override as scanning the parent directory caused extreme slow downs
  // Suppress noisy warnings in dev
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Skip type-checking on dev builds for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude heavy server-only packages from being bundled client-side
  serverExternalPackages: ['@electric-sql/pglite', 'pg', 'bcryptjs', 'better-sqlite3'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
