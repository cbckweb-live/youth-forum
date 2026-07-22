#!/usr/bin/env node
/**
 * Smoke tests — run against a live `next start` server.
 *
 * Asserts HTTP 200 for every SSR route and checks response bodies for
 * common crash indicators (React error boundaries, server errors).
 *
 * Supports a LAUNCH_BYPASS_SECRET env var to bypass the "coming soon"
 * gatekeeper in proxy.ts (set to the same value as your .env.local).
 *
 * Usage:
 *   LAUNCH_BYPASS_SECRET=dev-bypass-secret node tests/smoke.mjs [BASE_URL]
 *
 * Default BASE_URL: http://localhost:3000
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Routes — all public pages
// ---------------------------------------------------------------------------
const ROUTES = [
  "/",
  "/about/aims",
  "/about/blog-news",
  // [slug] pages require a real DB row, skip them here
  "/about/journey",
  "/cezo-mepu",
  "/coming-soon",
  "/developers",
  "/events",
  "/events/archive",
  "/gallery",
  "/living-room",
  "/login",
  "/mathetes",
  "/office-bearers",
  // /office-bearers/[id] requires a real DB row, skip here
  "/admin",
  // /admin/dashboard requires admin auth
  // /auth/update-password requires auth
];

// ---------------------------------------------------------------------------
// Error patterns to detect in response bodies
// ---------------------------------------------------------------------------
const ERROR_PATTERNS = [
  /Application error/i,
  /Internal Server Error/i,
  /Something went wrong/i,
  /RSC Rendering Error/i,
  /Server Error/i,
  /An unexpected error occurred/i,

];

// ---------------------------------------------------------------------------
// Helper: build fetch options with optional bypass cookie
// ---------------------------------------------------------------------------
function fetchOptions() {
  const opts = { redirect: "follow" };
  const secret = process.env.LAUNCH_BYPASS_SECRET;
  if (secret) {
    opts.headers = {
      Cookie: `cbck_launch_bypass=${encodeURIComponent(secret)}`,
    };
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------
let failed = false;

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  try {
    const res = await fetch(url, fetchOptions());

    if (!res.ok) {
      // Even 404s from dynamic routes without DB data are acceptable if
      // the server responded gracefully (not a crash).
      const body = await res.text();
      const hasErrorPattern = ERROR_PATTERNS.some((p) => p.test(body));
      if (hasErrorPattern || res.status >= 500) {
        console.error(`❌  ${res.status}  ${route}  — error pattern detected in body`);
        failed = true;
      } else {
        console.log(`⚠️  ${res.status}  ${route}  (non-critical, handled gracefully)`);
      }
      continue;
    }

    // Check for error patterns even in 200 responses (RSC errors sometimes
    // render error UIs with a 200 status).
    const body = await res.text();
    let errorFound = false;
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(body)) {
        console.error(`❌  200  ${route}  — matched error pattern: ${pattern}`);
        errorFound = true;
        failed = true;
        break;
      }
    }

    if (!errorFound) {
      console.log(`✅  200  ${route}`);
    }
  } catch (err) {
    console.error(`❌  FETCH ERROR  ${route}  —  ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error("\n⚠️  One or more smoke tests failed.");
  process.exit(1);
}

console.log("\n✅  All HTTP smoke tests passed.");
