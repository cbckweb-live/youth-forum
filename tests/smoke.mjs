#!/usr/bin/env node
/**
 * Smoke tests — run against a live `next start` server.
 * Asserts HTTP 200 for every SSR route that has previously broken due to
 * ESM/CJS interop errors (or any other server-side crash).
 *
 * Usage: node tests/smoke.mjs [BASE_URL]
 * Default BASE_URL: http://localhost:3000
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const ROUTES = [
  "/about/blog-news",
  // office-bearers/[id] requires a real DB row; we test the listing page
  // which exercises the same Supabase + sanitize-html server path.
  "/office-bearers",
  // Spot-check a few other dynamic routes while we're here.
  "/events",
  "/gallery",
];

let failed = false;

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      console.log(`✅  ${res.status}  ${route}`);
    } else {
      console.error(`❌  ${res.status}  ${route}`);
      failed = true;
    }
  } catch (err) {
    console.error(`❌  FETCH ERROR  ${route}  —  ${err.message}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nOne or more smoke tests failed.");
  process.exit(1);
}

console.log("\nAll smoke tests passed.");
