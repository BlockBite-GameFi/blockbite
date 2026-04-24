/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    // pino-pretty is an optional dev dep of @walletconnect's pino logger
    // — mark it as a non-fatal external so the build stops warning about it.
    config.externals = [...(config.externals || []), 'pino-pretty', 'encoding'];
    return config;
  },
};

export default nextConfig;
