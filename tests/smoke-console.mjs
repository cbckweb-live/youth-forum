#!/usr/bin/env node
/**
 * Browser-level smoke test — runs against a live `next start` or `next dev`
 * server using Puppeteer to capture console errors on every public page.
 *
 * Supports a LAUNCH_BYPASS_SECRET env var to bypass the "coming soon"
 * gatekeeper in proxy.ts (set to the same value as your .env.local).
 *
 * Usage:
 *   LAUNCH_BYPASS_SECRET=dev-bypass-secret node tests/smoke-console.mjs [BASE_URL]
 *
 * Default BASE_URL: http://localhost:3000
 */

import puppeteer from "puppeteer";
import fs from "fs";

const BASE = process.argv[2] ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Find a usable Chrome/Chromium executable
// ---------------------------------------------------------------------------
function findChrome() {
  // Allow override via PUPPETEER_EXECUTABLE_PATH env var
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Common installation paths across platforms
  const candidates = [
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Routes — all public pages
// ---------------------------------------------------------------------------
const ROUTES = [
  { path: "/", label: "Homepage" },
  { path: "/about/aims", label: "Aims" },
  { path: "/about/blog-news", label: "Blog / News" },
  { path: "/about/journey", label: "Journey" },
  { path: "/cezo-mepu", label: "Cezo Mepu" },
  { path: "/coming-soon", label: "Coming Soon" },
  { path: "/developers", label: "Developers" },
  { path: "/events", label: "Events" },
  { path: "/events/archive", label: "Events Archive" },
  { path: "/gallery", label: "Gallery" },
  { path: "/living-room", label: "Living Room" },
  { path: "/login", label: "Login" },
  { path: "/mathetes", label: "Mathetes" },
  { path: "/office-bearers", label: "Office Bearers" },
  { path: "/admin", label: "Admin Login" },
];

// ---------------------------------------------------------------------------
// Known/expected console messages that should NOT cause test failure
// ---------------------------------------------------------------------------
const ALLOWED_PATTERNS = [
  // Sentry dev-mode warnings are expected in development
  /Sentry/i,
  // Next.js HMR / dev-server logs
  /Next\.js/i,
  /Turbopack/i,
  // Vercel Analytics / Insights — only available on Vercel deployments, not localhost
  /_vercel/i,
  // RSC request aborts often cascade from other failures (e.g., analytics script)
  /ERR_ABORTED/i,
  // Google Maps / third-party embed warnings (not our code)
  /maps\.googleapis/i,
  // Browser extensions
  /chrome-extension:/i,
  // React DevTools
  /react-devtools/i,
  // PerformanceObserver (benign)
  /PerformanceObserver/i,
  // Non-critical preload warnings (e.g., intentionally deferred images)
  /preload/i,
  // "Failed to load resource" is a generic Chrome message for any bad HTTP
  // response. It's redundant with our "response" listener (which captures
  // the actual URL), so we filter it to avoid double-counting.
  /Failed to load resource/i,
];

function isAllowed(msg) {
  return ALLOWED_PATTERNS.some((p) => p.test(msg));
}

// ---------------------------------------------------------------------------
// Run the browser smoke test
// ---------------------------------------------------------------------------
let failed = false;

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    "❌  Could not find Chrome/Chromium executable.\n" +
    "    Set PUPPETEER_EXECUTABLE_PATH to the path of your Chrome binary.\n" +
    "    Or install Chrome from https://www.google.com/chrome/"
  );
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  const bypassSecret = process.env.LAUNCH_BYPASS_SECRET;

  // Set the bypass cookie if provided (to get past the "coming soon" gate)
  if (bypassSecret) {
    await page.setCookie({
      name: "cbck_launch_bypass",
      value: bypassSecret,
      domain: new URL(BASE).hostname,
      path: "/",
      httpOnly: true,
    });
  }

  for (const { path, label } of ROUTES) {
    const url = `${BASE}${path}`;
    const errors = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push({ type: "console.error", text: msg.text() });
      }
    });

    // Listen for uncaught page errors
    page.on("pageerror", (err) => {
      errors.push({ type: "pageerror", text: err.message });
    });

    // Listen for failed requests (network errors like DNS fails, connection refused)
    page.on("requestfailed", (req) => {
      errors.push({
        type: "requestfailed",
        text: `${req.url()} — ${req.failure()?.errorText ?? "unknown"}`,
      });
    });

    // Listen for server-error responses (4xx/5xx) — these show up as console
    // errors in the browser but don't always trigger "requestfailed".
    page.on("response", (res) => {
      const status = res.status();
      if (status >= 400) {
        errors.push({
          type: `HTTP ${status}`,
          text: `${res.url()}`,
        });
      }
    });

    let httpStatus = null;
    try {
      const response = await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      httpStatus = response?.status() ?? null;
      // Give the page a moment to settle and fire any async errors
      await new Promise((r) => setTimeout(r, 2000));
    } catch (navErr) {
      // Navigation timeout might be due to slow dev server — still report
      // any errors captured so far
      console.warn(`⚠️  Navigation timeout on ${label} (${path}) — ${navErr.message}`);
    }

    // Filter out allowed messages
    const realErrors = errors.filter((e) => !isAllowed(e.text));

    // Check HTTP status
    const statusOk = httpStatus ? httpStatus >= 200 && httpStatus < 400 : false;

    if (realErrors.length === 0 && statusOk) {
      console.log(`✅  ${label.padEnd(20)} ${path}  [${httpStatus ?? "???"}]`);
    } else {
      const issues = [];
      if (!statusOk) issues.push(`HTTP ${httpStatus}`);
      if (realErrors.length > 0) issues.push(`${realErrors.length} console error(s)`);
      console.error(`❌  ${label.padEnd(20)} ${path}  — ${issues.join(", ")}`);
      for (const err of realErrors) {
        console.error(`     [${err.type}] ${err.text}`);
      }
      failed = true;
    }

    // Clean up listeners for the next page
    page.removeAllListeners("console");
    page.removeAllListeners("pageerror");
    page.removeAllListeners("requestfailed");
    page.removeAllListeners("response");
  }
} finally {
  await browser.close();
}

if (failed) {
  console.error("\n⚠️  One or more browser smoke tests found console errors.");
  process.exit(1);
}

console.log("\n✅  All browser smoke tests passed — no console errors detected.");
