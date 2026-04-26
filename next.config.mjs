/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Expose safe public env vars to the browser bundle
  env: {
    NEXT_PUBLIC_APP_NAME: 'BlockBite',
    NEXT_PUBLIC_APP_VERSION: '0.1.0-devnet',
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },

  webpack: (config) => {
    // pino-pretty / encoding are optional peer-deps — silence the build warnings
    config.externals = [...(config.externals || []), 'pino-pretty', 'encoding'];
    return config;
  },

  // Strict Content Security Policy headers (overridden per-route in vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
