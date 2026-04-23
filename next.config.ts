import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow cross-origin images (if needed for wallet logos in Phase 1)
  images: {
    remotePatterns: [],
  },
  // Ensure CSS modules work
  experimental: {},
};

export default nextConfig;
