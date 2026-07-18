import { NextRequest, NextResponse } from "next/server";

/**
 * CSP Middleware — generates a per-request nonce and sets a strict
 * Content-Security-Policy header.
 *
 * Why middleware instead of next.config.ts headers():
 *   CSP nonces must be unique per request. Static headers in next.config
 *   cannot express dynamic nonces, so we generate one in middleware and
 *   pass it to layouts/components via a custom "x-nonce" header.
 */

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random nonce base64-encoded.
 * crypto.randomUUID() returns a version‑4 UUID (122 random bits).
 */
function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/**
 * Build a strict CSP string using the given nonce.
 *
 * Dev note: React DevTools’ source-map integration internally uses
 * `eval()` during development, so we keep `'unsafe-eval'` in dev only.
 */
function buildCsp(nonce: string, isDev: boolean): string {
  const parts = [
    // ── Default  ────────────────────────────────────────
    `default-src 'self'`,

    // ── Scripts  ────────────────────────────────────────
    // 'strict-dynamic' propagates trust to scripts loaded dynamically
    // by a nonce‑adorned script.  We keep explicit https://vercel.live
    // as a fallback for browsers that do not support 'strict-dynamic'.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live${
      isDev ? " 'unsafe-eval'" : ""
    }`,

    // ── Styles  ─────────────────────────────────────────
    // Tailwind / CSS modules rely on inline <style> tags
    // that Next.js generates; these do not receive a nonce,
    // so 'unsafe-inline' is required for styles.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // ── Fonts  ──────────────────────────────────────────
    `font-src 'self' data: https://fonts.gstatic.com`,

    // ── Images  ─────────────────────────────────────────
    // blob: for cropped images, data: for tiny inline images,
    // https: for any external image (Supabase, YouTube thumbs, etc.)
    `img-src 'self' data: blob: https:`,

    // ── Web Workers  ────────────────────────────────────
    `worker-src blob:`,

    // ── Connections  ────────────────────────────────────
    // Sentry error reporting, Supabase API, Vercel live,
    // Pusher WebSocket (used if any push‑based features exist).
    `connect-src 'self' https://*.sentry.io https://emsfthlfptmysgzpectv.supabase.co https://*.supabase.co https://vercel.live wss://ws-us3.pusher.com`,

    // ── Frames  ─────────────────────────────────────────
    // Google Maps in the footer, YouTube embeds on The Living Room page.
    `frame-src https://www.google.com https://google.com https://www.youtube.com`,

    // ── Misc  ───────────────────────────────────────────
    `object-src 'none'`,
    `base-uri 'none'`,
    `form-action 'self'`,
  ];

  return parts.join("; ");
}

// ── Middleware ────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCsp(nonce, isDev);

  // Clone the request headers so we can inject the nonce for Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set the CSP on the response
  response.headers.set("Content-Security-Policy", csp);

  // Also expose the nonce so layouts / components can read it
  response.headers.set("x-nonce", nonce);

  return response;
}

// ── Matcher ──────────────────────────────────────────────────────────────
// Process page requests only — skip API routes, static assets, and
// prefetch requests (which don't need CSP enforcement for HTML).
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
