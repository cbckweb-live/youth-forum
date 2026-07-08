#!/usr/bin/env node
/**
 * Fails if any known ESM-only packages that break Next.js SSR appear in the
 * installed dependency tree. Run this before `next build` in CI.
 *
 * @exodus/bytes has NO CJS-compatible version — every release is ESM-only.
 * The only safe fix is to keep it out of the tree entirely (i.e. never add
 * isomorphic-dompurify or jsdom as a production dependency).
 *
 * Add to FORBIDDEN whenever a new ESM-only transitive dep causes a
 * ERR_REQUIRE_ESM crash at runtime.
 */
import { execSync } from "node:child_process";

const FORBIDDEN = [
  "isomorphic-dompurify", // pulls jsdom → @exodus/bytes (ESM-only, no CJS version exists)
  "jsdom",                // sub-dep @exodus/bytes is ESM-only
  "@exodus/bytes",        // ESM-only — every version uses "type":"module", no require() support
];

let found = false;
for (const pkg of FORBIDDEN) {
  try {
    // yarn why exits 0 and prints a tree if the package is present
    const out = execSync(`yarn why ${pkg} 2>&1`, { encoding: "utf8" });
    if (!out.includes("This module exists because") === false || out.includes("Done in")) {
      // yarn why prints "Done in Xs." even when not found; check for the real signal
    }
    if (out.includes("This module exists because")) {
      console.error(`❌  Forbidden ESM-only dep detected in tree: ${pkg}`);
      console.error(out.trim());
      found = true;
    }
  } catch {
    // non-zero exit or "not found" output — package is absent, which is correct
  }
}

if (found) {
  console.error(
    "\nFix: remove the package that pulls in the forbidden dep.\n" +
    "Note: @exodus/bytes has NO CJS-compatible version — it cannot be overridden.\n" +
    "The only safe fix is to not depend on jsdom or isomorphic-dompurify in production."
  );
  process.exit(1);
}

console.log("✅  No forbidden ESM-only deps found.");
