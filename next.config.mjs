import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ESLint errors must not block production builds — linting is a CI step,
  // not a deploy gate. TypeScript errors still block builds.
  eslint: { ignoreDuringBuilds: true },

  // Expose safe public env vars to the browser bundle
  env: {
    NEXT_PUBLIC_APP_NAME: 'BlockBite',
    NEXT_PUBLIC_APP_VERSION: '0.1.0-devnet',
    // NEXT_PUBLIC_APP_URL is set per-environment in Vercel dashboard
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    // pino-pretty / encoding are optional peer-deps — silence the build warnings
    config.externals = [...(config.externals || []), 'pino-pretty', 'encoding'];

    // ── Solana / Anchor browser polyfills ──────────────────────────────────────
    // webpack 5 removed automatic Node.js polyfills.  @solana/web3.js and
    // @coral-xyz/anchor both use Buffer heavily; without this the app crashes
    // in the browser with "Buffer is not defined".
    //
    // ProvidePlugin injects Buffer into every browser module that references it,
    // matching the global that Node.js provides natively.  We scope this to
    // browser bundles only (isServer === false) so the server bundle is unchanged.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        // Solana doesn't need these; set false so webpack stops warning
        crypto:  false,
        stream:  false,
        path:    false,
        fs:      false,
        net:     false,
        tls:     false,
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer:  ['buffer', 'Buffer'],
          process: ['process/browser'],
        }),
      );
    }

    return config;
  },

  // Permanent redirects for uppercase route variants. Next.js App Router
  // is case-sensitive — visitors typing /PARTNERSHIP, /DISTRIBUTE, etc.
  // (often pasted from chat / docs / press) would hit a 404. These rewrites
  // normalize to the canonical lowercase path with a 308 (preserves the
  // HTTP method, friendly for any future POST endpoints under same path).
  async redirects() {
    const upper = [
      'PARTNERSHIP', 'DISTRIBUTE', 'QUESTS', 'LEADERBOARD',
      'SHOP', 'GUIDE', 'MAP', 'PROFILE', 'WAITLIST',
      'GAME', 'PLAY', 'CLAIM',
    ];
    return [
      ...upper.map((seg) => ({
        source: `/${seg}/:path*`,
        destination: `/${seg.toLowerCase()}/:path*`,
        permanent: true,
      })),
      ...upper.map((seg) => ({
        source: `/${seg}`,
        destination: `/${seg.toLowerCase()}`,
        permanent: true,
      })),
    ];
  },

  // Security headers applied globally (can be overridden per-route in vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' + 'unsafe-eval' kept for Next.js runtime + wallet adapters
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              // connect-src: every wallet adapter the app loads needs its own
              // hostnames or the connect handshake silently fails (visible
              // symptom: Connect Wallet button does nothing, no error in UI).
              // Browser extensions inject their providers via window.solana
              // but adapters STILL hit network endpoints for:
              //   - Phantom mobile deep-link flow + RPC bridge
              //   - Solflare detect + r.solflare.com fallback
              //   - WalletConnect relay (mobile QR pairing)
              //   - Coinbase Wallet SDK relay
              //   - Trust Wallet bridge
              //   - Ledger transport over WebUSB/WebHID (handled by browser, no URL)
              //   - Public Solana RPC + Helius + user-supplied private RPCs (Alchemy/QuikNode)
              [
                "connect-src",
                "'self'",
                "https://*.solana.com",
                "https://*.helius-rpc.com",
                "https://*.supabase.co",
                "https://api.mainnet-beta.solana.com",
                "https://api.devnet.solana.com",
                "https://*.phantom.app",
                "https://*.solflare.com",
                "https://*.walletconnect.com",
                "https://*.walletconnect.org",
                "https://*.coinbase.com",
                "https://*.cbhq.net",
                "https://*.trustwallet.com",
                "https://*.ledger.com",
                "https://*.alchemy.com",
                "https://*.quiknode.pro",
                "https://*.ankr.com",
                "https://*.triton.one",
                "wss:",
                "ws:",
                "data:",
                "blob:",
              ].join(' '),
              // Wallet popups + WalletConnect QR modal may iframe themselves
              "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://*.coinbase.com",
              "img-src 'self' data: https: blob:",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
