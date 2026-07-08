import type { NextConfig } from "next";
import "./lib/env";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // Prevents clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' and 'unsafe-eval' for hydration/dev overlay.
      // script-src-elem is set explicitly so browsers don't fall back to script-src alone.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "script-src-elem 'self' 'unsafe-inline' https://vercel.live",
      // Google Fonts stylesheet is loaded from fonts.googleapis.com.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Google Fonts files are served from fonts.gstatic.com.
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // Supabase API + Vercel Live feedback widget both need connect-src.
      "connect-src 'self' https://emsfthlfptmysgzpectv.supabase.co https://*.supabase.co https://vercel.live wss://ws-us3.pusher.com",
      // Google Maps embed (Footer) + YouTube embeds (Living Room).
      "frame-src https://www.google.com https://google.com https://www.youtube.com",
    ].join('; '),
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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
