import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [],
  },

  // ── SECURITY HEADERS ─────────────────────────────────────────
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // Content Security Policy
    // In dev: allow unsafe-eval for HMR. In prod: strict.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline'";

    const cspDirectives = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Allow images from self, data URIs, blobs (for Excel export) and Supabase storage
      "img-src 'self' data: blob: https://*.supabase.co",
      // Allow API calls to self and Supabase
      "connect-src 'self' https://*.supabase.co https://*.upstash.io",
      // Never allow this page to be embedded in a frame
      "frame-ancestors 'none'",
      // Block all plugins
      "object-src 'none'",
      // Upgrade insecure requests in production
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking (belt AND suspenders with frame-ancestors in CSP)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing attacks
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS for 2 years, including subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Control referrer information leakage
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser feature access
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          // XSS Protection for legacy browsers (modern browsers use CSP)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Prevent cross-origin attacks via window.opener
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Prevent cross-origin resource embedding
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          // Prevent cross-origin reads
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
        ],
      },
      // Cache static assets aggressively (they have content hashes)
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSerwist(nextConfig);
