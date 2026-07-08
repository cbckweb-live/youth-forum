#!/usr/bin/env node
/**
 * Fails if any known ESM-only packages that break Next.js SSR appear in the
 * installed dependency tree. Run this before `next build` in CI.
 *
 * Add to this list whenever a new ESM-only transitive dep causes a
 * ERR_REQUIRE_ESM crash at runtime.
 */
import { execSync } from "node:child_process";

const FORBIDDEN = [
  "isomorphic-dompurify", // pulls jsdom → @exodus/bytes (ESM-only)
  "jsdom",                // @exodus/bytes sub-dep is ESM-only
  "@exodus/bytes",        // ESM-only, breaks require() in Next.js SSR
];

let found = false;
for (const pkg of FORBIDDEN) {
  try {
    const out = execSync(`npm ls ${pkg} --depth=10 2>&1`, { encoding: "utf8" });
    // npm ls exits non-zero when the package isn't found; if we get here it IS present
    if (out.includes(pkg) && !out.includes("(empty)")) {
      console.error(`❌  Forbidden ESM-only dep detected in tree: ${pkg}`);
      console.error(out.trim());
      found = true;
    }
  } catch {
    // non-zero exit = package not found = good
  }
}

if (found) {
  console.error(
    "\nFix: remove the package that pulls in the forbidden dep, or add an\n" +
    "npm override in package.json to pin it to a CJS-compatible version."
  );
  process.exit(1);
}

console.log("✅  No forbidden ESM-only deps found.");
