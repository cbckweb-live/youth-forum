#!/usr/bin/env node
import { readFileSync } from "fs";

const beforePath = process.argv[2];
const afterPath = process.argv[3];

if (!beforePath || !afterPath) {
  console.error("Usage: node lh-compare.mjs <before.json> <after.json>");
  process.exit(1);
}

function load(path) {
  let raw = readFileSync(path, "utf-8");
  // Strip any Lighthouse log prefix lines (non-JSON lines at start)
  const firstBrace = raw.indexOf("{");
  if (firstBrace > 0) raw = raw.slice(firstBrace);
  // Strip trailing non-JSON content (e.g., log lines after the JSON)
  const lastBrace = raw.lastIndexOf("}");
  if (lastBrace > 0) raw = raw.slice(0, lastBrace + 1);
  return JSON.parse(raw);
}

const before = load(beforePath);
const after = load(afterPath);

console.log("=".repeat(65));
console.log("LIGHTHOUSE COMPARISON");
console.log(`Before: ${before.fetchTime?.slice(0, 10) ?? "?"}`);
console.log(`After:  ${after.fetchTime?.slice(0, 10) ?? "?"}`);
console.log("=".repeat(65));

console.log("\nCategories:");
const cats = ["performance", "accessibility", "best-practices", "seo"];
for (const cat of cats) {
  const b = before.categories[cat]?.score ?? 0;
  const a = after.categories[cat]?.score ?? 0;
  const delta = a - b;
  const sym = delta > 0 ? "▲" : delta < 0 ? "▼" : "─";
  console.log(`  ${cat.padEnd(20)} ${(b * 100).toFixed(0).padStart(3)}/100  ${(a * 100).toFixed(0).padStart(3)}/100  ${sym} ${(delta * 100) > 0 ? "+" : ""}${(delta * 100).toFixed(0)}`);
}

console.log("\nCore Metrics:");
const metrics = [
  ["first-contentful-paint", "FCP", "ms"],
  ["largest-contentful-paint", "LCP", "ms"],
  ["speed-index", "Speed Index", "ms"],
  ["total-blocking-time", "TBT", "ms"],
  ["cumulative-layout-shift", "CLS", ""],
  ["interactive", "TTI", "ms"],
];

for (const [aid, label, unit] of metrics) {
  const b = before.audits[aid] ?? {};
  const a = after.audits[aid] ?? {};
  const bv = b.numericValue;
  const av = a.numericValue;

  if (typeof bv === "number" && typeof av === "number") {
    const delta = av - bv;
    const pct = bv !== 0 ? (delta / bv) * 100 : 0;
    let sym;
    if (delta < -10) sym = "↓ IMPROVED";
    else if (delta > 10) sym = "↑ WORSENED";
    else sym = "─ SAME";

    const bStr = unit ? `${bv.toFixed(0)}${unit}` : bv.toFixed(3);
    const aStr = unit ? `${av.toFixed(0)}${unit}` : av.toFixed(3);
    console.log(`  ${label.padEnd(15)} ${bStr.padStart(10)}  ${aStr.padStart(10)}  ${sym}  (${Math.abs(delta).toFixed(0)}${unit}, ${Math.abs(pct).toFixed(0)}%)`);
  } else {
    console.log(`  ${label.padEnd(15)} ${"N/A".padStart(10)}  ${"N/A".padStart(10)}`);
  }
}

// Diagnostics from "after"
console.log("\nImage/Resource Diagnostics (After):");
const diagIds = [
  "uses-responsive-images",
  "offscreen-images",
  "total-byte-weight",
  "uses-optimized-images",
  "modern-image-formats",
  "uses-rel-preload",
  "render-blocking-resources",
];
for (const id of diagIds) {
  const a = after.audits[id];
  if (!a) continue;
  const icon = a.score === 1 ? "✅" : a.score === 0 ? "❌" : a.score == null ? "⚠️" : `⚠️(${a.score})`;
  const dv = a.displayValue ?? "";
  console.log(`  ${icon} ${a.title} ${dv}`);
}
