# Build Error Analysis — CBCK Youth Forum (Vercel Deployment)

## Summary

The Vercel production build fails at the **"Collecting page data"** phase with a `sharp` native module loading error. The build successfully compiles TypeScript and Turbopack bundles, but crashes when it tries to load the sharp binary at runtime for the `/api/admin/media/upload` route on the Vercel Linux x64 environment.

**Root Cause:** Version mismatch between two installed `sharp` packages — Next.js 16.2.9 bundles `sharp@0.34.5` internally, while the project's `package.json` explicitly specifies `sharp@^0.35.3`. The resulting binary from `sharp@0.35.3` requires `libvips-cpp.so.8.18.3` (libvips 1.3.x), which is not available on Vercel's build runtime.

---

## Build Failure: Error Details

### The Error (from Vercel build log)

```
Error: Failed to load external module sharp-20c6a5da84e2135f: Error: Could not load the "sharp" module using the linux-x64 runtime
ERR_DLOPEN_FAILED: libvips-cpp.so.8.18.3: cannot open shared object file: No such file or directory
```

- **Context:** `Collecting page data using 1 worker` → specifically for route `/api/admin/media/upload`
- **Phase:** After successful TypeScript compilation and Turbopack bundling — the error is a **runtime module load failure**, not a compile error
- **Local build note:** The `build-output-full.txt` shows a **successful local build** on the developer's machine (Windows), confirming this is a **Vercel environment-specific issue**

### Affected File

`app/api/admin/media/upload/route.ts` (line 4): `import sharp from "sharp";`

This is the only route that imports `sharp` directly. It uses sharp to:
- Validate image files by reading magic bytes
- Re-encode images as WebP (with JPEG fallback) to strip EXIF/metadata
- Auto-rotate based on EXIF orientation

---

## Root Cause Analysis

### 1. Two Versions of sharp in node_modules

From the `yarn.lock` analysis, TWO versions of sharp are installed:

| Version | How It's Pulled In | libvips Version | Platform Binaries |
|---------|-------------------|-----------------|-------------------|
| **0.34.5** | `next@16.2.9` (optional dependency) | `@img/sharp-libvips-linux-x64@1.2.4` | Included for linux-x64 |
| **0.35.3** | `package.json` explicit `"sharp": "^0.35.3"` | `@img/sharp-libvips-linux-x64@1.3.2` | Installed but **binary may be missing** |

### 2. The Version Mismatch Chain

```
package.json: "sharp": "^0.35.3"  (explicit dependency)
    ↓
yarn installs sharp@0.35.3 in node_modules/sharp
    ↓
sharp@0.35.3 depends on @img/sharp-libvips-linux-x64@1.3.2
    ↓
libvips 1.3.2 requires libvips-cpp.so.8.18.3
    ↓
Vercel build environment has libvips for sharp 0.34.x (libvips 1.2.x)
    ↓
**libvips-cpp.so.8.18.3 not found → ERR_DLOPEN_FAILED**
```

### 3. Why It Succeeds Locally but Fails on Vercel

| Environment | Sharp Binary | libvips Availability | Result |
|------------|-------------|---------------------|--------|
| Local (Windows 11) | `sharp-win32-x64@0.35.3` | Bundled with the package | ✅ Succeeds |
| Vercel Build (linux-x64) | `sharp-linux-x64@0.35.3` | Missing `libvips-cpp.so.8.18.3` | ❌ Fails |

### 4. The `serverExternalPackages` Config

`next.config.ts` includes:
```ts
serverExternalPackages: ['sharp'],
```

This tells Next.js to load sharp as an **external Node.js native module** rather than bundling it via Turbopack. When Turbopack encounters `import sharp from "sharp"` in the upload route, it generates a reference to load the native binary at runtime. The error's module ID `sharp-20c6a5da84e2135f` confirms Turbopack is creating an external module reference for sharp, which then fails to load because the platform binary is incompatible.

---

## Solution

### Option A: Align sharp version with Next.js (Recommended)

**Change `package.json`** from `"sharp": "^0.35.3"` to `"sharp": "^0.34.5"`.

```diff
  "dependencies": {
    ...
-   "sharp": "^0.35.3",
+   "sharp": "^0.34.5",
    ...
  }
```

Then clean and reinstall:
```bash
rm -rf node_modules yarn.lock
yarn install
```

**Why this works:** `next@16.2.9` optionally depends on `sharp@^0.34.5`. By matching versions, only one version of sharp and its corresponding libvips binaries are installed. Vercel's build environment has the correct libvips libraries for sharp 0.34.x.

**Version differences between 0.34.5 and 0.35.3 (non-breaking for this use case):**
- Both versions support `.webp()`, `.jpeg()`, `.png()`, `.metadata()`, `.rotate()`
- The API surface used in `route.ts` (`sharp(buffer).metadata()`, `.rotate().webp()`, `.rotate().jpeg()`) is identical between versions
- 0.35.3 added WebAssembly support for edge environments — irrelevant for this project (all server-side)

### Option B: Use resolutions to force single version

Add `sharp` to the existing `resolutions` block in `package.json`:

```json
"resolutions": {
  "postcss": "^8.5.10",
  "postcss-selector-parser": "^6.1.3",
  "sharp": "0.34.5"
}
```

### Option C: Remove sharp from serverExternalPackages (Turbopack fallback)

Remove `sharp` from `serverExternalPackages` in `next.config.ts` to let Turbopack bundle it:

```diff
- serverExternalPackages: ['sharp'],
+ serverExternalPackages: [],
```

However, this is less reliable — native modules bundled via Turbopack can have their own issues.

### Option D: Install platform-specific optional dependencies

Add to `package.json`:
```json
"optionalDependencies": {
  "@img/sharp-linux-x64": "0.35.3",
  "@img/sharp-libvips-linux-x64": "1.3.2"
}
```

This forces installation of the exact linux-x64 binary, but it only works if libvips 1.3.x is compatible with Vercel's underlying OS libraries — which is uncertain.

---

## Verification

After applying **Option A**:

1. **Local test:** Run `yarn build` locally to confirm TypeScript compiles and the build completes
2. **Check sharp version:** `node -e "console.log(require('sharp/package.json').version)"` should show `0.34.5`
3. **Deploy to Vercel:** The build should pass the "Collecting page data" phase without the sharp module loading error

---

## Other Observations from the Build Output

- **Middleware deprecation warning:** The `build-output-full.txt` shows `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — The file `proxy.ts` is already using the new convention, so this is just informational
- **Existing build (`build-output-full.txt`) was successful** on the developer's local machine, confirming the code itself is correct
- **Route map shows 15 routes** (11 static, 4 dynamic) and 1 Proxy (middleware)
- The `/living-room` and `/coming-soon` pages don't appear in the route list from the successful local build — they may be new additions or have different configurations
