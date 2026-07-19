import type { NextConfig } from "next";
import "./lib/env";

/**
 * Static security headers — set via next.config.ts because they never
 * change between requests.
 *
 * CSP is deliberately NOT here; it is set dynamically in middleware.ts
 * so that each request gets a unique nonce.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.cbckyouthforum.live",
          },
        ],
        destination: "https://cbckyouthforum.live/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  serverExternalPackages: ['sharp'],
  images: {
    deviceSizes: [640, 1080, 1920],
    imageSizes: [32, 96, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "emsfthlfptmysgzpectv.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
    qualities: [25, 50, 75, 85, 95, 100],
  },
};

export default nextConfig;
